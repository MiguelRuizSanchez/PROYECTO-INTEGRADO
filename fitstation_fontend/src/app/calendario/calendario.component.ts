import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../profile.service';
import { ClassService } from '../class.service'; // 🚀 Servicio de clases conectado
import { RouterModule } from '@angular/router';

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
  clasesColectivas: any[] = []; // Reservas o turnos del usuario
  
  // Control de pestañas del panel dual
  vistaActual: 'entrenamientos' | 'clases' = 'entrenamientos';
  
  rol: string = '';
  idInterno: number = 0;
  nameMes: string = '';
  nombreMes: string = '';

  constructor(
    private profileService: ProfileService, 
    private classService: ClassService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.rol = (localStorage.getItem('userRole') || '').toLowerCase();
    this.obtenerIdYDatos();
  }

  obtenerIdYDatos() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        const d = res?.details || res?.Details;
        this.idInterno = d?.idClient || d?.IdClient || d?.idWorker || d?.IdWorker;
        this.cargarTodoElCalendario();
      }
    });
  }

  // Descarga síncrona de las dos agendas en paralelo
  cargarTodoElCalendario() {
    const peticionSesiones = this.rol === 'worker' 
      ? this.profileService.getWorkerSessions(this.idInterno) 
      : this.profileService.getClientSessions(this.idInterno);

    const peticionClases = this.rol === 'worker'
      ? this.classService.getWorkerClassCalendar()
      : this.classService.getClientClassCalendar();

    peticionSesiones.subscribe(resSesiones => {
      this.sesiones = resSesiones;
      
      peticionClases.subscribe(resClases => {
        this.clasesColectivas = resClases;
        this.generarCalendario();
      });
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

    // 1. Rellenar días vacíos al principio de la rejilla
    for (let i = 0; i < offset; i++) {
      this.diasMes.push({ dia: null, sesiones: [], clases: [] });
    }

    // 2. Construcción y filtrado de los días del mes
    for (let i = 1; i <= totalDiasMes; i++) {
      const fechaDia = new Date(año, mes, i);
      const nombreDiaSemana = diasSemanaMap[fechaDia.getDay()];
      
      const sesionesDia = this.sesiones.filter(s => {
        const sFecha = s.scheduledDate || s.ScheduledDate;
        if (!sFecha) return false;
        const d = new Date(sFecha);
        return d.getDate() === i && d.getMonth() === mes && d.getFullYear() === año;
      });

      const clasesDia = this.clasesColectivas.filter(c => {
        if (this.rol === 'worker') {
          const day = c.dayOfWeek || c.DayOfWeek;
          return day === nombreDiaSemana;
        } else {
          const bFecha = c.bookingDate || c.BookingDate;
          if (!bFecha) return false;
          const d = new Date(bFecha);
          return d.getDate() === i && d.getMonth() === mes && d.getFullYear() === año;
        }
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

  // 🚀 NUEVO MÉTODO: Envía la orden de cancelación y actualiza el calendario al instante
  cancelarClase(idBooking: number) {
    if (confirm('¿Estás seguro de que deseas cancelar tu reserva en esta clase colectiva?')) {
      this.classService.cancelBooking(idBooking).subscribe({
        next: (res) => {
          alert(res.message || '❌ Reserva cancelada.');
          this.cargarTodoElCalendario(); // 🔥 Mágico: Vuelve a cargar todo para borrarla visualmente
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