import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-gestion-rutinas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './routine-management.component.html',
  styleUrl: './routine-management.component.css'
})
export class RoutineManagementComponent implements OnInit {
  // sessionId: ID de la cita que estamos gestionando.
  sessionId!: number;

  // clientId: ID del alumno al que le queremos poner la rutina.
  clientId!: number;

  // studentName: Nombre que sale en la pantalla para saber a quién estamos asignando la rutina.
  studentName: string = 'Cargando...';

  // myRoutines: La lista de todas las rutinas que el entrenador ha creado.
  myRoutines: any[] = [];

  // selectedRoutineId: El ID de la rutina que hemos elegido en el desplegable.
  selectedRoutineId: number = 0;

  // isShowingPreview: Si es verdadero, abrimos la ventana flotante para ver los ejercicios.
  isShowingPreview: boolean = false;

  // previewRoutineName: El nombre de la rutina que estamos visualizando en la ventana flotante.
  previewRoutineName: string = '';

  // routineExercises: La lista de ejercicios que tiene la rutina que estamos viendo.
  routineExercises: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  // Al entrar, obtenemos el ID de la sesión y cargamos los datos necesarios.
  ngOnInit() {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSessionData();
    this.loadRoutineLibrary();
  }

  // Pide los datos de la sesión para saber quién es el alumno y su nombre.
  loadSessionData() {
    this.profileService.getSessionDetails(this.sessionId).subscribe({
      next: (res: any) => {
        // Obtenemos el ID del cliente y su nombre desde la respuesta del backend.
        this.clientId = res.idClient || res.IdClient || 0;
        this.studentName = res.nombre || res.Nombre || 'Alumno';
        this.cdr.detectChanges();
      },
      error: () => {
        this.studentName = 'Alumno';
        this.cdr.detectChanges();
      }
    });
  }

  // Descarga la biblioteca de rutinas que el entrenador ha creado previamente.
  loadRoutineLibrary() {
    this.profileService.getWorkerRoutines(0).subscribe({
      next: (res) => {
        this.myRoutines = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar la biblioteca de rutinas:", err)
    });
  }

  // Busca los ejercicios de la rutina elegida y abre la ventana para que el entrenador los vea.
  previewRoutineContent() {
    const routineId = Number(this.selectedRoutineId);
    if (!routineId || routineId === 0) return;

    const selected = this.myRoutines.find(r => (r.idRoutine || r.IdRoutine) === routineId);
    this.previewRoutineName = selected?.name || selected?.Name || 'Vista Previa';
    this.isShowingPreview = true;

    // Pedimos al servicio los ejercicios detallados (series, repeticiones, etc.)
    this.profileService.getRoutineDetails(routineId).subscribe({
      next: (exercises) => {
        this.routineExercises = exercises;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al descargar ejercicios:", err)
    });
  }

  // Envía la orden al servidor para que la rutina quede asignada al alumno.
  assignRoutine() {
    if (this.selectedRoutineId == 0) {
      alert("Por favor, selecciona una rutina válida.");
      return;
    }

    const payload = {
      IdClient: this.clientId,
      IdRoutine: Number(this.selectedRoutineId)
    };

    this.profileService.assignRoutineToClient(payload).subscribe({
      next: () => {
        alert(" Rutina asignada con éxito al alumno.");
        this.router.navigate(['/dashboard']); // Volvemos al panel principal tras asignar
      },
      error: (err) => {
        const serverError = err.error?.message || err.error || err.message;
        alert("Error al realizar la asignación: " + serverError);
      }
    });
  }

  // Cierra la ventana de previsualización.
  closePreviewModal() {
    this.isShowingPreview = false;
    this.routineExercises = [];
    this.cdr.detectChanges();
  }
}
