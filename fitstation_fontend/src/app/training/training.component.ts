import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../profile.service';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-entrenamiento',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.css']
})
export class TrainingComponent implements OnInit {
  // sessionId: Guardamos el ID de la sesión actual que viene de la URL.
  sessionId!: number;
  
  // clientId: ID del alumno para buscar qué rutinas le han asignado.
  clientId!: number;
  
  // coachName: Nombre del entrenador que sale en la cabecera.
  coachName: string = 'Cargando Coach...';

  // assignedRoutines: Lista de rutinas que el coach ha enviado al alumno.
  assignedRoutines: any[] = [];
  
  // rutinaSeleccionada: Si el alumno pincha en una rutina, aquí guardamos los detalles para mostrar.
  rutinaSeleccionada: any = null;
  
  // ejerciciosDeLaRutina: Lista con los detalles (series, repes, etc.) de la rutina que estamos viendo.
  exercisesOfRoutine: any[] = [];
  
  // isLoading: Indica si la pantalla está cargando los datos.
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  // Se ejecuta al entrar: obtenemos el ID de la URL y cargamos los datos.
  ngOnInit() {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSessionData();
  }

  // Pide al servidor los detalles de la sesión para identificar al alumno y al coach.
  loadSessionData() {
    this.profileService.getSessionDetails(this.sessionId).subscribe({
      next: (res: any) => {
        if (res && (res.idClient || res.IdClient)) {
          this.clientId = res.idClient || res.IdClient;
          this.coachName = res.nombre || res.Nombre || 'Entrenador';
          this.loadRoutineList();
        } else {
          this.coachName = 'Entrenador';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.coachName = 'Entrenador';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Descarga las rutinas vinculadas a este alumno desde la base de datos.
  loadRoutineList() {
    this.profileService.getClientRoutines(this.clientId).subscribe({
      next: (res) => {
        this.assignedRoutines = res || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar las rutinas del alumno:", err);
        this.assignedRoutines = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Cuando el alumno pulsa sobre una rutina, descargamos sus ejercicios detallados.
  viewDetails(routine: any) {
    this.rutinaSeleccionada = routine;
    const routineId = routine.idRoutine || routine.IdRoutine;

    this.profileService.getRoutineDetails(routineId).subscribe({
      next: (exercises) => {
        this.exercisesOfRoutine = exercises || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al descargar los ejercicios:", err);
        this.exercisesOfRoutine = [];
        this.cdr.detectChanges();
      }
    });
  }

  // Cierra la vista de detalle y vuelve a la lista principal de rutinas.
  closeDetails() {
    this.rutinaSeleccionada = null;
    this.exercisesOfRoutine = [];
    this.cdr.detectChanges();
  }
}