import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import { ProfileService } from '../profile.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.css']
})
export class BuscadorComponent implements OnInit {
  coaches: any[] = [];
  cargando: boolean = true;
  clientId: number = 0;
  esWorker: boolean = false;

  // Variables del Modal de Reserva
  mostrandoModal: boolean = false;
  coachSeleccionado: any = null;
  diaElegido: string = 'Monday';
  horaElegida: string = '10:00';

  constructor(
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        const role = (res?.role || res?.Role || '').toLowerCase();
        const d = res?.details || res?.Details;
        let perfilIncompleto = false;

        if (role === 'worker') {
          this.esWorker = true;
          perfilIncompleto = !d || (!d.bio && !d.Bio);
        } else {
          perfilIncompleto = !d || (!d.objectives && !d.Objectives);
          this.clientId = d?.idClient || d?.IdClient;
        }

        if (perfilIncompleto) {
          alert("🛑 ¡Alto ahí! Debes completar tu perfil antes de buscar o recibir matches.");
          this.router.navigate(['/cuestionario']);
          return; 
        }

        if (!this.esWorker && this.clientId) {
          this.cargarSugerencias();
        } else {
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  cargarSugerencias() {
    this.profileService.getSuggestedWorkers(this.clientId).subscribe({
      next: (data: any[]) => {
        this.coaches = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error("Error cargando matches:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
horasPosibles: string[] = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
horasOcupadas: string[] = [];

 abrirModalReserva(coach: any) {
  this.coachSeleccionado = coach;
  this.mostrandoModal = true;
  this.horaElegida = ''; // Resetear selección
  this.actualizarHorasOcupadas();
}

actualizarHorasOcupadas() {
  const workerId = this.coachSeleccionado.workerId || this.coachSeleccionado.IdWorker;
  this.profileService.getOccupiedSlots(workerId, this.diaElegido).subscribe(res => {
    this.horasOcupadas = res;
  });
}

seleccionarHora(hora: string) {
  if (this.horasOcupadas.includes(hora)) return;
  this.horaElegida = hora;
}

  cerrarModal() {
    this.mostrandoModal = false;
    this.coachSeleccionado = null;
  }

  confirmarSolicitud() {
    if (!this.coachSeleccionado) return;
    
    const workerId = this.coachSeleccionado.workerId || this.coachSeleccionado.WorkerId;
    
    const payload = {
      WorkerId: workerId,
      RequestedDay: this.diaElegido,
      RequestedTime: `${this.horaElegida}:00` // Formato TimeSpan para C#
    };

    this.profileService.sendMatchRequest(payload).subscribe({
      next: (res: any) => {
        alert(res.message || '✅ ¡Solicitud de match enviada al entrenador!');
        this.cerrarModal();
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        alert(err.error?.message || 'Ya tienes una solicitud pendiente o activa con este coach.');
        this.cerrarModal();
      }
    });
  }

}