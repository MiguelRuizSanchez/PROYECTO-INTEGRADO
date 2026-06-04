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
  // Identificadores de la sesión y los usuarios involucrados
  sessionId!: number;
  receiverId!: number;
  currentUserId = Number(localStorage.getItem('userId'));
  userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  
  // Datos principales de la cabecera de la pantalla
  receiverName: string = 'Cargando...';
  sessionModality: string = ''; // AQUÍ ESTABA EL ERROR: Antes ponía modality
  sessionDetails: any = null;

  // Variables para controlar el funcionamiento del chat en tiempo real
  chatMessages: any[] = [];
  newMessageContent: string = '';
  pollingIntervalId: any;

  // Variables para controlar la asignación de tablas de entrenamiento
  assignedRoutines: any[] = []; 
  workerRoutineLibrary: any[] = [];   
  selectedRoutineId: number = 0;

  // Variables para abrir y cerrar la ventana flotante que muestra los ejercicios
  isShowingRoutineModal: boolean = false;
  previewRoutineInfo: any = null;
  previewRoutineExercises: any[] = [];

  constructor(
    private route: ActivatedRoute, 
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  // Al entrar a la pantalla, saca el ID de la URL y activa el temporizador del chat
  ngOnInit() {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadInitialData();
    
    // Temporizador: cada 3 segundos busca si la otra persona nos ha escrito algo nuevo
    this.pollingIntervalId = setInterval(() => {
      if (this.receiverId) this.loadChatHistory();
    }, 3000);
  }

  // Descarga los datos de esta sesión para saber con quién hablamos y qué modalidad es
  loadInitialData() {
    this.profileService.getSessionDetails(this.sessionId).subscribe({
      next: (res: any) => {
        this.sessionDetails = res.session || res.Session;
        this.receiverId = res.otherUserId || res.OtherUserId;
        this.receiverName = res.otherName || res.OtherName;
        this.sessionModality = res.modalidad || res.Modalidad;
        
        this.loadChatHistory();
        this.loadRoutines();
        this.cdr.detectChanges();
      }
    });
  }

  // Descarga todos los mensajes de texto guardados entre tu usuario y la otra persona
  loadChatHistory() {
    this.profileService.getChatHistory(this.receiverId).subscribe(msgs => {
      this.chatMessages = msgs;
      this.cdr.detectChanges();
    });
  }

  // Recoge el texto escrito en la caja, lo manda a la base de datos y limpia la caja
  sendMessage() {
    if (!this.newMessageContent.trim()) return;
    
    const payload = {
      ReceiverId: this.receiverId,
      Content: this.newMessageContent
    };

    this.profileService.sendMessage(payload).subscribe(() => {
      this.newMessageContent = '';
      this.loadChatHistory();
    });
  }

  // Carga las tablas de ejercicios del alumno. Si eres entrenador, también carga tu colección para poder enviarle una
  loadRoutines() {
    const clientId = this.sessionDetails?.idClient || this.sessionDetails?.IdClient;
    const workerId = this.sessionDetails?.idWorker || this.sessionDetails?.IdWorker;

    this.profileService.getClientRoutines(clientId).subscribe(res => {
      this.assignedRoutines = res;
      this.cdr.detectChanges();
    });

    if (this.userRole === 'worker') {
      this.profileService.getWorkerRoutines(workerId).subscribe(res => {
        this.workerRoutineLibrary = res;
        this.cdr.detectChanges();
      });
    }
  }

  // Envía la rutina seleccionada en el desplegable al alumno actual
  assignRoutine() {
    if (!this.selectedRoutineId) return;
    const clientId = this.sessionDetails.idClient || this.sessionDetails.IdClient;

    this.profileService.assignRoutineToClient({
      IdClient: clientId,
      IdRoutine: Number(this.selectedRoutineId)
    }).subscribe({
      next: () => {
        alert("Rutina asignada al alumno.");
        this.loadRoutines();
        this.selectedRoutineId = 0;
      }
    });
  }

  // Abre la ventana emergente para ver la lista completa de ejercicios que componen una rutina
  viewRoutineDetails(id: number) {
    this.profileService.getRoutineDetails(id).subscribe(exs => {
      this.previewRoutineExercises = exs;
      this.previewRoutineInfo = this.assignedRoutines.find(r => (r.idRoutine || r.IdRoutine) === id);
      this.isShowingRoutineModal = true;
      this.cdr.detectChanges();
    });
  }

  // Esconde la ventana flotante de los ejercicios de la pantalla
  closeModal() {
    this.isShowingRoutineModal = false;
  }

  // Al salir de esta pantalla, destruye el temporizador del chat para que no siga gastando datos
  ngOnDestroy() {
    if (this.pollingIntervalId) clearInterval(this.pollingIntervalId);
  }
}