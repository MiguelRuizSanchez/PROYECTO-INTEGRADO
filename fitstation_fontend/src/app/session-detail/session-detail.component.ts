import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  // Identificadores
  sessionId!: number;
  receiverId!: number;
  myId = Number(localStorage.getItem('userId'));
  miRol = (localStorage.getItem('userRole') || '').toLowerCase();
  
  // Datos de Cabecera
  receiverName: string = 'Cargando...';
  modalidad: string = '';
  detallesSesion: any = null;

  // Chat
  mensajes: any[] = [];
  nuevoMensaje: string = '';
  polling: any;

  // Rutinas
  rutinasAsignadas: any[] = []; // Las que el alumno ya tiene
  misRutinasBase: any[] = [];   // Las que el coach ha creado y puede asignar
  rutinaSeleccionadaId: number = 0;

  // Modal Visualizador
  mostrandoModalRutina: boolean = false;
  rutinaViendoInfo: any = null;
  ejerciciosRutinaViendo: any[] = [];

  constructor(
    private route: ActivatedRoute, 
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatosIniciales();
    
    // Polling: Miramos si hay mensajes nuevos cada 3 segundos
    this.polling = setInterval(() => {
      if (this.receiverId) this.cargarChat();
    }, 3000);
  }

  cargarDatosIniciales() {
    // 1. Obtenemos los detalles de la sesión para saber con quién hablamos
    this.profileService.getSessionDetails(this.sessionId).subscribe({
      next: (res: any) => {
        this.detallesSesion = res.session || res.Session;
        this.receiverId = res.otherUserId || res.OtherUserId;
        this.receiverName = res.otherName || res.OtherName;
        this.modalidad = res.modalidad || res.Modalidad;
        
        this.cargarChat();
        this.cargarRutinas();
        this.cdr.detectChanges();
      }
    });
  }

  cargarChat() {
    this.profileService.getChatHistory(this.receiverId).subscribe(msgs => {
      this.mensajes = msgs;
      this.cdr.detectChanges();
    });
  }

  enviar() {
    if (!this.nuevoMensaje.trim()) return;
    
    const payload = {
      ReceiverId: this.receiverId,
      Content: this.nuevoMensaje // 'Content' coincide con tu ChatController
    };

    this.profileService.sendMessage(payload).subscribe(() => {
      this.nuevoMensaje = '';
      this.cargarChat();
    });
  }

  cargarRutinas() {
    const clientId = this.detallesSesion?.idClient || this.detallesSesion?.IdClient;
    const workerId = this.detallesSesion?.idWorker || this.detallesSesion?.IdWorker;

    // El alumno ve sus rutinas asignadas
    this.profileService.getClientRoutines(clientId).subscribe(res => {
      this.rutinasAsignadas = res;
      this.cdr.detectChanges();
    });

    // Si soy el Coach, cargo mis rutinas creadas para poder enviarlas
    if (this.miRol === 'worker') {
      this.profileService.getWorkerRoutines(workerId).subscribe(res => {
        this.misRutinasBase = res;
        this.cdr.detectChanges();
      });
    }
  }

  enviarRutina() {
    if (!this.rutinaSeleccionadaId) return;
    const clientId = this.detallesSesion.idClient || this.detallesSesion.IdClient;

    this.profileService.assignRoutineToClient({
      IdClient: clientId,
      IdRoutine: Number(this.rutinaSeleccionadaId)
    }).subscribe({
      next: () => {
        alert("✅ Rutina asignada al alumno.");
        this.cargarRutinas();
        this.rutinaSeleccionadaId = 0;
      }
    });
  }

  verDetalleRutina(id: number) {
    this.profileService.getRoutineDetails(id).subscribe(exs => {
      this.ejerciciosRutinaViendo = exs;
      this.rutinaViendoInfo = this.rutinasAsignadas.find(r => (r.idRoutine || r.IdRoutine) === id);
      this.mostrandoModalRutina = true;
      this.cdr.detectChanges();
    });
  }

  cerrarModal() {
    this.mostrandoModalRutina = false;
  }

  ngOnDestroy() {
    if (this.polling) clearInterval(this.polling);
  }
}