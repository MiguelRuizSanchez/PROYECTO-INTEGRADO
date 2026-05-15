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

  // Variables del Modal de Reserva (Mantenidas intactas)
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
    // 🔍 CHIVATO DIAGNÓSTICO 1: Si ves este mensaje en pantalla, sabemos que las rutas están BIEN y el fallo es de la API.
    alert("🔍 DIAGNÓSTICO: El componente Buscador ha conseguido ejecutarse con éxito.");
    this.verificarPerfil();
  }

  verificarPerfil() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        const role = (res?.role || res?.Role || '').toLowerCase();
        const d = res?.details || res?.Details;
        
        if (role === 'client') {
          const tieneObjetivos = d?.objectives || d?.Objectives || d?.goal || d?.Goal;
          
          if (!tieneObjetivos) {
            this.perfilIncompleto = true;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
          }
          
          this.clientId = d?.idClient || d?.IdClient || 0;
          this.cargarSugerencias();
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        // 🔍 CHIVATO DIAGNÓSTICO 2: Nos dirá si la llamada al perfil está rota.
        alert(`❌ ERROR EN PERFIL (Profile/me): Código ${err.status} - ${err.message}`);
        this.clientId = 0;
        this.cargarSugerencias();
      }
    });
  }

  cargarSugerencias() {
    const idSeguro = this.clientId > 0 ? this.clientId : 0;
    
    this.profileService.getSuggestedWorkers(idSeguro).subscribe({
      next: (res: any) => {
        this.coaches = res;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        // 🔍 CHIVATO DIAGNÓSTICO 3: Nos dirá si lo que falla es la base de datos de entrenadores.
        alert(`❌ ERROR EN BUSCADOR (Matching/suggested-workers): Código ${err.status}\nDetalle: ${err.error?.message || err.message}`);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- LÓGICA DEL MODAL (Mantenida intacta) ---
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
      RequestedTime: `${this.horaElegida}:00` 
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