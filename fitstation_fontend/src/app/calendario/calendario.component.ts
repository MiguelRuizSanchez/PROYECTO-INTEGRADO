import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../profile.service';
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
  rol: string = '';
  idInterno: number = 0;
  nombreMes: string = '';

  constructor(private profileService: ProfileService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.rol = (localStorage.getItem('userRole') || '').toLowerCase();
    this.obtenerIdYDatos();
  }

  obtenerIdYDatos() {
    // Recuperamos el perfil para saber si cargar sesiones de alumno o coach
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        const d = res?.details || res?.Details;
        this.idInterno = d?.idClient || d?.IdClient || d?.idWorker || d?.IdWorker;
        this.cargarSesiones();
      }
    });
  }

  cargarSesiones() {
    // Llamamos al endpoint correspondiente según el rol del usuario
    const peticion = this.rol === 'worker' 
      ? this.profileService.getWorkerSessions(this.idInterno) 
      : this.profileService.getClientSessions(this.idInterno);

    peticion.subscribe(res => {
      this.sesiones = res;
      this.generarCalendario();
    });
  }

  generarCalendario() {
    const año = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();
    
    // Título del mes (ej: "mayo de 2026")
    this.nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(this.mesActual);

    const primerDiaMes = new Date(año, mes, 1).getDay(); 
    const totalDiasMes = new Date(año, mes + 1, 0).getDate();

    // Ajuste para que la semana empiece en Lunes (0: Dom, 1: Lun...)
    const offset = primerDiaMes === 0 ? 6 : primerDiaMes - 1;

    this.diasMes = [];

    // 1. Rellenar huecos vacíos al principio del mes
    for (let i = 0; i < offset; i++) {
      this.diasMes.push({ dia: null, sesiones: [] });
    }

    // 2. Generar los días reales del mes
    for (let i = 1; i <= totalDiasMes; i++) {
      const fechaDia = new Date(año, mes, i);
      
      // Filtramos las sesiones que coincidan con este día exacto
      const sesionesDia = this.sesiones.filter(s => {
        const sFecha = s.scheduledDate || s.ScheduledDate;
        if (!sFecha) return false;
        const d = new Date(sFecha);
        return d.getDate() === i && d.getMonth() === mes && d.getFullYear() === año;
      });

      this.diasMes.push({
        dia: i,
        esHoy: i === new Date().getDate() && mes === new Date().getMonth() && año === new Date().getFullYear(),
        sesiones: sesionesDia
      });
    }
    this.cdr.detectChanges();
  }

  cambiarMes(delta: number) {
    this.mesActual.setMonth(this.mesActual.getMonth() + delta);
    this.mesActual = new Date(this.mesActual); // Nueva referencia para Angular
    this.generarCalendario();
  }
}