import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../profile.service';
import { ClassService } from '../class.service'; 
import { RouterModule, ActivatedRoute } from '@angular/router'; // 🚀 Conectamos ActivatedRoute para capturar la URL
import { HttpClient, HttpHeaders } from '@angular/common/http'; 

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css']
})
export class CalendarioComponent implements OnInit {
  mesActual: Date = new Date();
  diasMes: any[] = [];
  sesiones: any[] = [];
  clasesColectivas: any[] = []; // Almacena las clases asignadas a este usuario concreto
  clasesGlobalesGimnasio: any[] = []; // Pool de clases del gimnasio para catálogo inferior
  
  // Control de pestañas dinámicas del panel dual
  vistaActual: 'entrenamientos' | 'clases' = 'entrenamientos';
  
  rol: string = '';
  idInterno: number = 0;
  nombreMes: string = '';

  constructor(
    private profileService: ProfileService, 
    private classService: ClassService, 
    private http: HttpClient, 
    private route: ActivatedRoute, // 🚀 Inyectamos el lector de rutas en el constructor
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.rol = (localStorage.getItem('userRole') || '').toLowerCase().trim();
    
    // 🚀 INTERCEPTOR SMART: Lee la URL y si detecta el parámetro del Dashboard activa la pestaña de clases
    this.route.queryParams.subscribe(params => {
      if (params['vista'] === 'clases') {
        this.vistaActual = 'clases';
      } else {
        this.vistaActual = 'entrenamientos';
      }
      this.cdr.detectChanges();
    });

    this.obtenerIdYDatos();
  }

  obtenerIdYDatos() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        if (!this.rol) {
          this.rol = (res?.role || res?.Role || '').toLowerCase().trim();
        }
        const d = res?.details || res?.Details;
        this.idInterno = d?.idClient || d?.IdClient || d?.idWorker || d?.IdWorker;
        this.cargarTodoElCalendario();
      },
      error: (err) => {
        console.error("Error al obtener perfil en el calendario:", err);
      }
    });
  }

  cargarTodoElCalendario() {
    const peticionSesiones = this.rol === 'worker' 
      ? this.profileService.getWorkerSessions(this.idInterno) 
      : this.profileService.getClientSessions(this.idInterno);

    const peticionClases = this.rol === 'worker'
      ? this.classService.getWorkerClassCalendar()
      : this.classService.getClientClassCalendar();

    peticionSesiones.subscribe({
      next: (resSesiones) => {
        this.sesiones = resSesiones || [];
        
        peticionClases.subscribe({
          next: (resClases) => {
            this.clasesColectivas = resClases || [];
            
            // Descarga del catálogo general activo de la BD
            this.http.get('http://localhost:5038/api/Class/available').subscribe({
              next: (resGlobales: any) => {
                this.clasesGlobalesGimnasio = resGlobales || [];
                this.generarCalendario();
              },
              error: (err) => {
                console.error("Error al cargar el catálogo global disponible:", err);
                this.clasesGlobalesGimnasio = [];
                this.generarCalendario();
              }
            });
          },
          error: (err) => {
            console.error("Error al cargar clases colectivas personales:", err);
            this.clasesColectivas = [];
            this.generarCalendario();
          }
        });
      },
      error: (err) => {
        console.error("Error al cargar sesiones privadas:", err);
        this.sesiones = [];
        
        peticionClases.subscribe({
          next: (resClases) => {
            this.clasesColectivas = resClases || [];
            this.http.get('http://localhost:5038/api/Class/available').subscribe({
              next: (resGlobales: any) => {
                this.clasesGlobalesGimnasio = resGlobales || [];
                this.generarCalendario();
              },
              error: () => {
                this.clasesGlobalesGimnasio = [];
                this.generarCalendario();
              }
            });
          },
          error: () => {
            this.clasesColectivas = [];
            this.generarCalendario();
          }
        });
      }
    });
  }

  generarCalendario() {
    const año = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();
    
    this.nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(this.mesActual);

    const primerDiaMes = new Date(año, mes, 1).getDay(); 
    const totalDiasMes = new Date(año, mes + 1, 0).getDate();
    const offset = primerDiaMes === 0 ? 6 : primerDiaMes - 1;

    this.diasMes = [];

    const diasSemanaMap: { [key: number]: string } = {
      0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'
    };

    for (let i = 0; i < offset; i++) {
      this.diasMes.push({ dia: null, sesiones: [], clases: [] });
    }

    for (let i = 1; i <= totalDiasMes; i++) {
      const fechaDia = new Date(año, mes, i);
      const nombreDiaSemana = diasSemanaMap[fechaDia.getDay()];
      
      const sesionesDia = this.sesiones.filter(s => {
        const sFecha = s.scheduledDate || s.ScheduledDate;
        if (!sFecha) return false;

        const estado = (s.status || s.Status || '').toLowerCase().trim();
        if (estado === 'completed') return false;

        const d = new Date(sFecha);
        return d.getDate() === i && d.getMonth() === mes && d.getFullYear() === año;
      });

      const clasesDia = this.clasesColectivas.filter(c => {
        if (this.rol === 'worker') {
          const idPropietario = c.idWorker || c.IdWorker || c.id_worker;
          if (idPropietario !== this.idInterno) return false;

          const fechaAsignada = c.bookingDate || c.BookingDate || c.assignment_date;
          if (!fechaAsignada) return false;

          const d = new Date(fechaAsignada);
          return d.getDate() === i && d.getMonth() === mes && d.getFullYear() === año;
        } else {
          const bFecha = c.bookingDate || c.BookingDate;
          if (!bFecha) return false;
          const d = new Date(bFecha);
          return d.getDate() === i && d.getMonth() === mes && d.getFullYear() === año;
        }
      });

      clasesDia.forEach(c => {
        const horaClase = (c.classTime || c.ClassTime || c.class_time || '').toString().substring(0, 5);
        const haySolape = sesionesDia.some(s => {
          const horaSesion = (s.startTime || s.StartTime || '').toString().substring(0, 5);
          return horaSesion === horaClase && horaClase !== '';
        });
        if (haySolape) c.hasConflict = true;
      });

      sesionesDia.forEach(s => {
        const horaSesion = (s.startTime || s.StartTime || '').toString().substring(0, 5);
        const haySolape = clasesDia.some(c => {
          const horaClase = (c.classTime || c.ClassTime || c.class_time || '').toString().substring(0, 5);
          return horaClase === horaSesion && horaSesion !== '';
        });
        if (haySolape) s.hasConflict = true;
      });

      this.diasMes.push({
        dia: i,
        esHoy: i === new Date().getDate() && mes === new Date().getMonth() && año === new Date().getFullYear(),
        sesiones: sesionesDia,
        clases: clasesDia
      });
    }
    this.cdr.detectChanges();
  }

  calcularFechaDeSemana(nombreDiaIngles: string): string {
    const mapaDias: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const diaObjetivo = mapaDias[nombreDiaIngles];
    if (diaObjetivo === undefined) return '';

    const hoy = new Date();
    const diaActual = hoy.getDay();
    
    let distancia = diaObjetivo - diaActual;
    if (distancia < 0) {
      distancia += 7; 
    }
    
    hoy.setDate(hoy.getDate() + CalendarioComponent.name.length * 0 + distancia);

    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  asignarClaseAWorker(idClass: number, nombreDiaSemana: string) {
    const fechaExacta = this.calcularFechaDeSemana(nombreDiaSemana);
    
    if (confirm(`¿Deseas impartir esta clase colectiva únicamente el día ${fechaExacta}?`)) {
      const tokenClave = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${tokenClave}` });

      this.http.post(`http://localhost:5038/api/Class/assign/${idClass}?chosenDate=${fechaExacta}`, {}, { headers }).subscribe({
        next: (res: any) => {
          alert(res.message || '✅ Clase asignada con éxito para esa fecha.');
          this.cargarTodoElCalendario();
        },
        error: (err) => {
          alert(err.error?.message || err.error || '⚠️ Ya estás asignado o hay un conflicto de horarios.');
        }
      });
    }
  }

  desasignarClaseAWorker(idClass: number, fechaAsignada: string) {
    if (!fechaAsignada) {
      alert("No se puede determinar la fecha de esta asignación.");
      return;
    }
    
    const d = new Date(fechaAsignada);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const fechaLimpia = `${yyyy}-${mm}-${dd}`;

    if (confirm(`¿Seguro que deseas cancelar tu turno de trabajo para el día ${fechaLimpia}?`)) {
      const tokenClave = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${tokenClave}` });

      this.http.post(`http://localhost:5038/api/Class/unassign/${idClass}?chosenDate=${fechaLimpia}`, {}, { headers }).subscribe({
        next: (res: any) => {
          alert(res.message || '✕ Turno liberado correctamente.');
          this.cargarTodoElCalendario();
        },
        error: (err) => {
          alert(err.error || '⚠️ No se pudo procesar la liberación en el servidor.');
        }
      });
    }
  }

  cancelarClase(idBooking: number) {
    if (confirm('¿Estás seguro de que deseas cancelar tu reserva en esta clase colectiva?')) {
      this.classService.cancelBooking(idBooking).subscribe({
        next: (res) => {
          alert(res.message || '❌ Reserva cancelada.');
          this.cargarTodoElCalendario();
        },
        error: (err) => {
          alert('⚠️ No se pudo procesar la cancelación: ' + (err.error || err.message));
        }
      });
    }
  }

  cambiarVista(nuevaVista: 'entrenamientos' | 'clases') {
    this.vistaActual = nuevaVista;
    this.cdr.detectChanges();
  }

  cambiarMes(delta: number) {
    this.mesActual.setMonth(this.mesActual.getMonth() + delta);
    this.mesActual = new Date(this.mesActual);
    this.generarCalendario();
  }
}