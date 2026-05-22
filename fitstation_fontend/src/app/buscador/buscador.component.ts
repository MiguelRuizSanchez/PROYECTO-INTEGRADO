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
  // Array de objetos que almacena los perfiles de los entrenadores devueltos por el algoritmo de matching del backend.
  suggestedCoaches: any[] = [];
  
  // Identificador unico del cliente actual en el sistema, necesario para realizar las peticiones de reserva.
  clientId: number = 0;
  
  // Bandera de control de estado de la interfaz de usuario durante las llamadas asincronas.
  isLoading: boolean = true;

  // Limites dinamicos para el calendario de reservas (ISO 8601 strings).
  minDate: string = '';
  maxDate: string = '';

  // Diccionarios (HashMaps) que vinculan el ID del entrenador con las selecciones del usuario en la interfaz.
  // Permiten gestionar multiples tarjetas de entrenador de forma independiente sin cruzar datos.
  selectedDates: { [key: number]: string } = {};
  selectedTimes: { [key: number]: string } = {};
  
  // Diccionario que almacena los arrays de horas no disponibles por cada entrenador consultado.
  occupiedSlotsPerCoach: { [key: number]: string[] } = {};

  // Coleccion constante que define los intervalos horarios disponibles en la jornada laboral estandar.
  availableTimeSlots: string[] = [
    '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  // Inyeccion de servicios para comunicacion HTTP (ProfileService) y manipulacion del DOM (ChangeDetectorRef).
  constructor(
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  // Metodo de inicializacion del componente.
  ngOnInit() {
    this.calculateDateWindow();
    this.fetchClientData();
  }

  // Calcula el rango temporal permitido para reservas, limitando el input de tipo 'date' a un margen de 14 dias desde la fecha actual.
  calculateDateWindow() {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 14);
    this.maxDate = futureDate.toISOString().split('T')[0];
  }

  // Recupera el perfil del usuario autenticado para extraer su ID y desencadenar la carga de entrenadores compatibles.
  fetchClientData() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        const details = res?.details || res?.Details;
        this.clientId = details?.idClient || details?.IdClient || 0;

        if (this.clientId > 0) {
          this.loadSuggestedCoaches(this.clientId);
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.error('Error fetching client profile data:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Obtiene el catalogo de entrenadores cuyo perfil coincide con los objetivos del cliente.
  // Inicializa los diccionarios de estado para cada entrenador devuelto.
  loadSuggestedCoaches(safeId: number) {
    this.profileService.getSuggestedWorkers(safeId).subscribe({
      next: (res: any[]) => {
        this.suggestedCoaches = res;

        this.suggestedCoaches.forEach(coach => {
          const id = coach.idWorker || coach.IdWorker;
          this.selectedDates[id] = this.minDate; 
          this.selectedTimes[id] = '';           
          this.occupiedSlotsPerCoach[id] = [];   

          // Evaluacion inmediata de la disponibilidad para la fecha cargada por defecto.
          this.checkOccupiedSlots(id);
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error fetching suggested coaches catalog:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Realiza una peticion al servidor para comprobar que tramos horarios de un dia especifico ya constan como ocupados en la base de datos para un entrenador.
  checkOccupiedSlots(workerId: number) {
    const date = this.selectedDates[workerId];
    if (!date) return;

    // Reinicio del valor temporal seleccionado para evitar inconsistencias al cambiar de fecha.
    this.selectedTimes[workerId] = '';

    this.profileService.getOccupiedSlots(workerId, date).subscribe({
      next: (res: string[]) => {
        this.occupiedSlotsPerCoach[workerId] = res || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error verifying coach availability:', err);
      }
    });
  }

  // Actualiza el modelo de datos de la interfaz cuando el usuario hace clic en un tramo horario especifico.
  // Ignora la accion si el tramo evaluado se encuentra en la coleccion de ocupados.
  selectTimeSlot(workerId: number, time: string) {
    if (this.isTimeSlotOccupied(workerId, time)) return; 
    this.selectedTimes[workerId] = time;
    this.cdr.detectChanges();
  }

  // Funcion de evaluacion logica que verifica la existencia de un tramo horario especifico dentro del arreglo de horas bloqueadas.
  isTimeSlotOccupied(workerId: number, time: string): boolean {
    const occupied = this.occupiedSlotsPerCoach[workerId] || [];
    return occupied.includes(time);
  }

  // Compila la informacion seleccionada y envia la solicitud formal de reserva de entrenamiento al servidor mediante POST.
  requestPrivateCoach(workerId: number) {
    const date = this.selectedDates[workerId];
    const time = this.selectedTimes[workerId];

    if (!date) {
      alert('⚠️ Por favor, selecciona una fecha válida en el calendario.');
      return;
    }

    if (!time) {
      alert('⚠️ Por favor, elige un tramo horario que esté disponible.');
      return;
    }

    this.profileService.requestCoach(workerId, date, time).subscribe({
      next: (res: any) => {
        alert(res.message || '✅ ¡Solicitud enviada al entrenador con éxito!');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        const backendMessage = err.error?.message ||
          (typeof err.error === 'string' ? err.error : 'Ya tienes una cita o petición en curso con este coach.');

        alert('⚠️ No se pudo enviar la solicitud: ' + backendMessage);
      }
    });
  }
}