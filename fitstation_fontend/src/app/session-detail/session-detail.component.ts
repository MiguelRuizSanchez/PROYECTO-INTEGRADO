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
  mensajes: any[] = [];
  nuevoMensaje: string = '';
  polling: any;

  detallesSesion: any = null;
  modalidad: string = '';
  especialidadEntrenador: string = '';
  objetivosPaco: string = '';

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
      }
    });
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
}