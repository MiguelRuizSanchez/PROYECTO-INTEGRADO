import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './buscador.component.html',
  styleUrl: './buscador.component.css'
})
export class BuscadorComponent implements OnInit {
  coachesSugeridos: any[] = [];
  idCliente: number = 0;
  cargando: boolean = true;

  // 📅 Gestión del Calendario (Margen seguro de 2 semanas)
  minDate: string = '';
  maxDate: string = '';

  // 🚀 Diccionarios reactivos por cada tarjeta de Entrenador
  fechasSeleccionadas: { [key: number]: string } = {};
  horasSeleccionadas: { [key: number]: string } = {};
  slotsOcupadosPorCoach: { [key: number]: string[] } = {};

  // ⏰ Listado de turnos fijos en intervalos de 1 hora (Jornada del Gimnasio)
  listadoHorarios: string[] = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  constructor(
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.calcularVentanaDeFechas();
    this.obtenerDatosCliente();
  }

  // 🗓️ Establece las restricciones del calendario (Hoy hasta dentro de 14 días)
  calcularVentanaDeFechas() {
    const hoy = new Date();
    this.minDate = hoy.toISOString().split('T')[0];

    const futuro = new Date();
    futuro.setDate(hoy.getDate() + 14);
    this.maxDate = futuro.toISOString().split('T')[0];
  }

  // 👤 Descarga el perfil del alumno para conocer su 'Goal' (Especialidad)
  obtenerDatosCliente() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        const d = res?.details || res?.Details;
        this.idCliente = d?.idClient || d?.IdClient || 0;
        
        if (this.idCliente > 0) {
          this.cargarCoaches(this.idCliente);
        } else {
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.error('Error al obtener perfil del atleta:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 🔍 Descarga solo los entrenadores compatibles con el alumno
  cargarCoaches(idSeguro: number) {
    this.profileService.getSuggestedWorkers(idSeguro).subscribe({
      next: (res: any[]) => {
        this.coachesSugeridos = res;
        
        // Inicializamos los valores por defecto de cada tarjeta
        this.coachesSugeridos.forEach(coach => {
          const id = coach.idWorker || coach.IdWorker;
          this.fechasSeleccionadas[id] = this.minDate; // Por defecto: Hoy
          this.horasSeleccionadas[id] = '';           // Ninguna tarjeta marcada al inicio
          this.slotsOcupadosPorCoach[id] = [];        // Lista de ocupación vacía
          
          // Consultamos inmediatamente las horas ocupadas de este coach para el día de hoy
          this.consultarSlotsOcupados(id);
        });

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al descargar catálogo de entrenadores:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ⏱️ Conexión reactiva con C#: Busca qué horas están ocupadas en el día elegido
  consultarSlotsOcupados(workerId: number) {
    const fecha = this.fechasSeleccionadas[workerId];
    if (!fecha) return;

    // Reseteamos la hora seleccionada al cambiar de fecha para evitar fantasmas
    this.horasSeleccionadas[workerId] = '';

    this.profileService.getOccupiedSlots(workerId, fecha).subscribe({
      next: (res: string[]) => {
        // Guardamos las horas ocupadas devueltas por el backend (ej: ["09:00", "18:00"])
        this.slotsOcupadosPorCoach[workerId] = res || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al consultar la disponibilidad del entrenador:', err);
      }
    });
  }

  // 🎯 El alumno pulsa una tarjeta de hora libre
  seleccionarHora(workerId: number, hora: string) {
    if (this.esHoraOcupada(workerId, hora)) return; // Si está bloqueada, no hace nada
    this.horasSeleccionadas[workerId] = hora;
    this.cdr.detectChanges();
  }

  // 🔒 Función auxiliar para saber si una hora concreta está pillada
  esHoraOcupada(workerId: number, hora: string): boolean {
    const ocupadas = this.slotsOcupadosPorCoach[workerId] || [];
    return ocupadas.includes(hora);
  }

  // 📩 ENVIAR SOLICITUD DE ENTRENAMIENTO PRIVADO 1-A-1
  solicitarEntrenador(workerId: number) {
    const fecha = this.fechasSeleccionadas[workerId];
    const hora = this.horasSeleccionadas[workerId];

    if (!fecha) {
      alert('⚠️ Por favor, selecciona una fecha válida en el calendario.');
      return;
    }

    if (!hora) {
      alert('⚠️ Por favor, elige una tarjeta de hora que esté disponible.');
      return;
    }

    this.profileService.requestCoach(workerId, fecha, hora).subscribe({
      next: (res: any) => {
        alert(res.message || '✅ ¡Solicitud enviada al entrenador con éxito!');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        alert('⚠️ No se pudo enviar la solicitud: ' + (err.error || err.message));
      }
    });
  }
}