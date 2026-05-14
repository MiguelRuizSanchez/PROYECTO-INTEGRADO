import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.css']
})
export class SessionDetailComponent implements OnInit, OnDestroy {
  sessionId!: number;
  receiverId!: number;
  receiverName: string = 'Cargando...';
  myId = Number(localStorage.getItem('userId'));
  miRol = localStorage.getItem('userRole') || '';
  
  mensajes: any[] = [];
  nuevoMensaje: string = '';
  polling: any;

  detallesSesion: any = null;
  modalidad: string = '';
  especialidadEntrenador: string = '';
  objetivosPaco: string = '';

  // 📦 VARIABLES PARA EL PANEL DE RUTINAS
  rutinaSeleccionadaId: number = 0;
  misRutinas: any[] = [];
  rutinasAsignadas: any[] = [];

  // 🔍 VARIABLES PARA EL MODAL DE DETALLE DE RUTINA
  mostrandoModalRutina: boolean = false;
  rutinaViendoInfo: any = null;
  ejerciciosRutinaViendo: any[] = [];

  constructor(private route: ActivatedRoute, private profileService: ProfileService) {}

  ngOnInit() {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatos();
    this.polling = setInterval(() => this.cargarChat(), 3000);
  }

  ngOnDestroy() { if (this.polling) clearInterval(this.polling); }

  cargarDatos() {
    this.profileService.getSessionDetails(this.sessionId).subscribe({
      next: (res: any) => {
        this.detallesSesion = res.session;
        this.receiverId = res.otherUserId;
        this.receiverName = res.otherName;
        this.modalidad = res.modalidad;
        this.especialidadEntrenador = res.especialidadEntrenador;
        this.objetivosPaco = res.objectives;
        
        this.cargarChat();
        this.cargarRutinas(); // 🚀 Cargamos las rutinas una vez tenemos los IDs de la sesión
      }
    });
  }

  cargarRutinas() {
    const clientId = this.detallesSesion.idClient || this.detallesSesion.IdClient;
    const workerId = this.detallesSesion.idWorker || this.detallesSesion.IdWorker;

    // 1. Cargar las rutinas que el alumno ya tiene asignadas
    this.profileService.getClientRoutines(clientId).subscribe(res => {
      this.rutinasAsignadas = res;
    });

    // 2. Si yo soy el entrenador, cargo mis rutinas de la biblioteca para poder asignarlas
    if (this.miRol === 'worker') {
      this.profileService.getWorkerRoutines(workerId).subscribe(res => {
        this.misRutinas = res;
      });
    }
  }

  cargarChat() {
    if (!this.receiverId) return;
    this.profileService.getChatHistory(this.receiverId).subscribe({
      next: (msgs: any[]) => {
        this.mensajes = msgs.map(m => ({
          ...m,
          text: m.message || m.Content || m.content,
          idSender: m.idSender || m.id_sender,
          time: m.createdAt || m.created_at || m.SentAt
        }));
      }
    });
  }

  enviar() {
    if (!this.nuevoMensaje.trim() || !this.receiverId) return;
    const payload = { receiverId: this.receiverId, content: this.nuevoMensaje };

    this.profileService.sendMessage(payload).subscribe({
      next: () => {
        this.nuevoMensaje = '';
        this.cargarChat();
      },
      error: (err) => {
        const errorMsg = err.error || "Error desconocido";
        alert("SERVIDOR DICE: " + (typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)));
      }
    });
  }

  // 🚀 LÓGICA DE ASIGNACIÓN
  enviarRutina() {
    if (!this.rutinaSeleccionadaId) return;
    const clientId = this.detallesSesion.idClient || this.detallesSesion.IdClient;

    const payload = {
      IdClient: clientId,
      IdRoutine: Number(this.rutinaSeleccionadaId)
    };

    this.profileService.assignRoutineToClient(payload).subscribe({
      next: (res: any) => {
        // Recargamos la lista de asignadas para que aparezca al instante
        this.cargarRutinas();
        this.rutinaSeleccionadaId = 0; // Reseteamos el selector
        
        // (Opcional) Enviar un mensaje automático al chat
        const msgAutomatico = `¡He añadido una nueva rutina a tu panel! Revísala a la derecha. 🏋️‍♂️`;
        this.profileService.sendMessage({ receiverId: this.receiverId, content: msgAutomatico }).subscribe(() => this.cargarChat());
      },
      error: (err) => alert(err.error?.message || "Error al asignar rutina")
    });
  }

  // 🚀 LÓGICA DEL VISUALIZADOR (MODAL)
  verDetalleRutina(idRoutine: number) {
    const rutina = this.rutinasAsignadas.find(r => r.idRoutine === idRoutine || r.IdRoutine === idRoutine);
    this.rutinaViendoInfo = rutina;
    
    this.profileService.getRoutineDetails(idRoutine).subscribe(res => {
      this.ejerciciosRutinaViendo = res;
      this.mostrandoModalRutina = true;
    });
  }

  cerrarModal() {
    this.mostrandoModalRutina = false;
    this.ejerciciosRutinaViendo = [];
  }
}