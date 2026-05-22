import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../profile.service';
import { ClassService } from '../class.service'; 
import { RouterModule, ActivatedRoute } from '@angular/router'; 
import { HttpClient, HttpHeaders } from '@angular/common/http'; 

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css']
})
export class CalendarioComponent implements OnInit {
  // Guarda la fecha del mes que estamos viendo en la pantalla.
  currentMonth: Date = new Date();
  
  // Lista con los días del mes. Cada día guardará sus propias clases y entrenamientos.
  calendarDays: any[] = [];
  
  // Lista de todas las sesiones de entrenamiento privado (1 a 1).
  sessions: any[] = [];
  
  // Lista de las clases grupales que el usuario tiene reservadas o va a dar.
  assignedClasses: any[] = []; 
  
  // Lista general con todas las clases que ofrece el gimnasio (para el panel de abajo del entrenador).
  globalClasses: any[] = []; 
  
  // Controla qué pestaña estamos viendo: la de sesiones privadas o la de clases grupales.
  currentView: 'entrenamientos' | 'clases' = 'entrenamientos';
  
  // Datos básicos del usuario para saber qué información cargar.
  userRole: string = '';
  internalId: number = 0;
  monthName: string = '';

  constructor(
    private profileService: ProfileService, 
    private classService: ClassService, 
    private http: HttpClient, 
    private route: ActivatedRoute, 
    private cdr: ChangeDetectorRef
  ) {}

  // Se ejecuta al abrir el calendario. 
  ngOnInit() {
    this.userRole = (localStorage.getItem('userRole') || '').toLowerCase().trim();
    
    // Si en la barra de direcciones de arriba pone "?vista=clases", marcamos esa pestaña directamente.
    this.route.queryParams.subscribe(params => {
      if (params['vista'] === 'clases') {
        this.currentView = 'clases';
      } else {
        this.currentView = 'entrenamientos';
      }
      this.cdr.detectChanges();
    });

    this.fetchUserIdAndData();
  }

  // Pide el perfil del usuario para saber su ID interno y luego poder buscar sus clases.
  fetchUserIdAndData() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        if (!this.userRole) {
          this.userRole = (res?.role || res?.Role || '').toLowerCase().trim();
        }
        const d = res?.details || res?.Details;
        this.internalId = d?.idClient || d?.IdClient || d?.idWorker || d?.IdWorker;
        this.loadFullCalendar();
      },
      error: (err) => {
        console.error("Error al obtener el perfil en el calendario:", err);
      }
    });
  }

  // Pide a la base de datos las clases y los entrenamientos al mismo tiempo para pintarlos juntos.
  loadFullCalendar() {
    const peticionSesiones = this.userRole === 'worker' 
      ? this.profileService.getWorkerSessions(this.internalId) 
      : this.profileService.getClientSessions(this.internalId);

    const peticionClases = this.userRole === 'worker'
      ? this.classService.getWorkerClassCalendar()
      : this.classService.getClientClassCalendar();

    peticionSesiones.subscribe({
      next: (resSesiones) => {
        this.sessions = resSesiones || [];
        
        peticionClases.subscribe({
          next: (resClases) => {
            this.assignedClasses = resClases || [];
            
            // Pide también el catálogo general de clases para el panel de abajo.
            this.http.get('http://localhost:5038/api/Class/available').subscribe({
              next: (resGlobales: any) => {
                this.globalClasses = resGlobales || [];
                this.generateCalendar();
              },
              error: (err) => {
                this.globalClasses = [];
                this.generateCalendar();
              }
            });
          },
          error: (err) => {
            this.assignedClasses = [];
            this.generateCalendar();
          }
        });
      },
      error: (err) => {
        this.sessions = [];
        this.generateCalendar();
      }
    });
  }

  // Dibuja la cuadrícula del calendario, rellena los días y detecta si hay choques de horarios (solapes).
  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // Pone el nombre del mes en español (ej. "mayo 2026").
    this.monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(this.currentMonth);

    const firstDayOfMonth = new Date(year, month, 1).getDay(); 
    const totalDaysMonth = new Date(year, month + 1, 0).getDate();
    // Ajustamos para que la semana empiece en Lunes
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    this.calendarDays = [];

    const weekDaysMap: { [key: number]: string } = {
      0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'
    };

    // Deja huecos vacíos al principio si el mes no empieza en lunes.
    for (let i = 0; i < offset; i++) {
      this.calendarDays.push({ dayNumber: null, sessions: [], classes: [] });
    }

    // Rellena cada día del mes con sus eventos.
    for (let i = 1; i <= totalDaysMonth; i++) {
      const dateOfDay = new Date(year, month, i);
      const nameOfDay = weekDaysMap[dateOfDay.getDay()];
      
      // Filtra las sesiones privadas de este día en concreto (ignorando las ya terminadas).
      const dailySessions = this.sessions.filter(s => {
        const sDate = s.scheduledDate || s.ScheduledDate;
        if (!sDate) return false;

        const status = (s.status || s.Status || '').toLowerCase().trim();
        if (status === 'completed') return false;

        const d = new Date(sDate);
        return d.getDate() === i && d.getMonth() === month && d.getFullYear() === year;
      });

      // Filtra las clases grupales de este día en concreto.
      const dailyClasses = this.assignedClasses.filter(c => {
        if (this.userRole === 'worker') {
          const ownerId = c.idWorker || c.IdWorker || c.id_worker;
          if (ownerId !== this.internalId) return false;

          const assignDate = c.bookingDate || c.BookingDate || c.assignment_date;
          if (!assignDate) return false;

          const d = new Date(assignDate);
          return d.getDate() === i && d.getMonth() === month && d.getFullYear() === year;
        } else {
          const bDate = c.bookingDate || c.BookingDate;
          if (!bDate) return false;
          const d = new Date(bDate);
          return d.getDate() === i && d.getMonth() === month && d.getFullYear() === year;
        }
      });

      // Comprueba si alguna clase grupal coincide a la misma hora que una sesión privada (Solape).
      dailyClasses.forEach(c => {
        const classTime = (c.classTime || c.ClassTime || c.class_time || '').toString().substring(0, 5);
        const hasCollision = dailySessions.some(s => {
          const sessionTime = (s.startTime || s.StartTime || '').toString().substring(0, 5);
          return sessionTime === classTime && classTime !== '';
        });
        if (hasCollision) c.hasConflict = true;
      });

      dailySessions.forEach(s => {
        const sessionTime = (s.startTime || s.StartTime || '').toString().substring(0, 5);
        const hasCollision = dailyClasses.some(c => {
          const classTime = (c.classTime || c.ClassTime || c.class_time || '').toString().substring(0, 5);
          return classTime === sessionTime && sessionTime !== '';
        });
        if (hasCollision) s.hasConflict = true;
      });

      // Añadimos el día ya preparado a la lista del calendario.
      this.calendarDays.push({
        dayNumber: i,
        isToday: i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear(),
        sessions: dailySessions,
        classes: dailyClasses
      });
    }
    this.cdr.detectChanges();
  }

  // Averigua qué fecha es el próximo lunes, martes, etc., dependiendo del día que le pasemos.
  calculateDateForWeekday(englishDayName: string): string {
    const daysMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const targetDay = daysMap[englishDayName];
    if (targetDay === undefined) return '';

    const today = new Date();
    const currentDay = today.getDay();
    
    let distance = targetDay - currentDay;
    if (distance < 0) {
      distance += 7; 
    }
    
    today.setDate(today.getDate() + distance);

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Sirve para que el entrenador se apunte a dar una clase del gimnasio.
  assignClassToWorker(idClass: number, weekDayName: string) {
    const exactDate = this.calculateDateForWeekday(weekDayName);
    
    if (confirm(`¿Deseas impartir esta clase colectiva únicamente el día ${exactDate}?`)) {
      const tokenStr = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${tokenStr}` });

      this.http.post(`http://localhost:5038/api/Class/assign/${idClass}?chosenDate=${exactDate}`, {}, { headers }).subscribe({
        next: (res: any) => {
          alert(res.message || '✅ Clase asignada con éxito para esa fecha.');
          this.loadFullCalendar();
        },
        error: (err) => {
          alert(err.error?.message || err.error || '⚠️ Ya estás asignado o hay un conflicto de horarios.');
        }
      });
    }
  }

  // Permite al entrenador anular su turno en una clase.
  unassignClassFromWorker(idClass: number, assignedDate: string) {
    if (!assignedDate) {
      alert("No se puede determinar la fecha de esta asignación.");
      return;
    }
    
    const d = new Date(assignedDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const cleanDate = `${yyyy}-${mm}-${dd}`;

    if (confirm(`¿Seguro que deseas cancelar tu turno de trabajo para el día ${cleanDate}?`)) {
      const tokenStr = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${tokenStr}` });

      this.http.post(`http://localhost:5038/api/Class/unassign/${idClass}?chosenDate=${cleanDate}`, {}, { headers }).subscribe({
        next: (res: any) => {
          alert(res.message || '✕ Turno liberado correctamente.');
          this.loadFullCalendar();
        },
        error: (err) => {
          alert(err.error || '⚠️ No se pudo procesar la liberación en el servidor.');
        }
      });
    }
  }

  // Permite al alumno borrar su plaza en una clase grupal.
  cancelBooking(idBooking: number) {
    if (confirm('¿Estás seguro de que deseas cancelar tu reserva en esta clase colectiva?')) {
      this.classService.cancelBooking(idBooking).subscribe({
        next: (res) => {
          alert(res.message || '❌ Reserva cancelada.');
          this.loadFullCalendar();
        },
        error: (err) => {
          alert('⚠️ No se pudo procesar la cancelación: ' + (err.error || err.message));
        }
      });
    }
  }

  // Cambia la pestaña visible entre sesiones privadas y clases grupales.
  switchView(newView: 'entrenamientos' | 'clases') {
    this.currentView = newView;
    this.cdr.detectChanges();
  }

  // Cambia de mes en el calendario y vuelve a calcular todos los días.
  changeMonth(delta: number) {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
    this.currentMonth = new Date(this.currentMonth);
    this.generateCalendar();
  }
}