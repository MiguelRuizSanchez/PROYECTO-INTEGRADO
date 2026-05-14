import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ProfileService } from '../profile.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.css']
})
export class BuscadorComponent implements OnInit {
  coaches: any[] = [];
  cargando: boolean = true;
  clientId: number = 0;
  perfilIncompleto: boolean = false;

  // Variables del Modal de Reserva
  mostrandoModal: boolean = false;
  coachSeleccionado: any = null;
  diaElegido: string = 'Monday';
  horaElegida: string = '';
  horasPosibles: string[] = ['08:00', '09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  horasOcupadas: string[] = [];

  constructor(
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.verificarPerfil();
  }

  verificarPerfil() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        const role = (res?.role || res?.Role || '').toLowerCase();
        const d = res?.details || res?.Details;
        
        // Verificamos si el cliente tiene objetivos guardados (usando ambas carcasas)
        if (role === 'client') {
          const tieneObjetivos = d?.objectives || d?.Objectives || d?.goal || d?.Goal;
          if (!tieneObjetivos) {
            this.perfilIncompleto = true;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
          }
          this.clientId = d?.idClient || d?.IdClient;
          this.cargarSugerencias();
        } else {
          // Si un entrenador entra aquí por error, lo mandamos al dashboard
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarSugerencias() {
    this.profileService.getSuggestedWorkers(this.clientId).subscribe({
      next: (res: any) => {
        this.coaches = res;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar sugerencias:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- LÓGICA DEL MODAL ---
  abrirModalReserva(coach: any) {
    this.coachSeleccionado = coach;
    this.mostrandoModal = true;
    this.horaElegida = ''; 
    this.actualizarHorasOcupadas();
  }

  actualizarHorasOcupadas() {
    const workerId = this.coachSeleccionado.workerId || this.coachSeleccionado.WorkerId;
    this.profileService.getOccupiedSlots(workerId, this.diaElegido).subscribe(res => {
      this.horasOcupadas = res;
    });
  }

  seleccionarHora(hora: string) {
    if (this.horasOcupadas.includes(hora)) return;
    this.horaElegida = hora;
  }

  confirmarSolicitud() {
    if (!this.coachSeleccionado || !this.horaElegida) return;
    
    const workerId = this.coachSeleccionado.workerId || this.coachSeleccionado.WorkerId;
    
    const payload = {
      WorkerId: workerId,
      RequestedDay: this.diaElegido,
      RequestedTime: `${this.horaElegida}:00` // Formato TimeSpan para C#
    };

    this.profileService.sendMatchRequest(payload).subscribe({
      next: () => {
        alert(`¡Solicitud enviada a ${this.coachSeleccionado.name || this.coachSeleccionado.Name}! Espera a que la acepte.`);
        this.mostrandoModal = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => alert(err.error?.message || 'Error al enviar solicitud')
    });
  }

  cerrarModal() {
    this.mostrandoModal = false;
    this.coachSeleccionado = null;
  }
}