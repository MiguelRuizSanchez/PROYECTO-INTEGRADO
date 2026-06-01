import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-crear-rutina',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-routine.component.html',
  styleUrls: ['./create-routine.component.css']
})
export class CreateRoutineComponent implements OnInit {
  // routineName: Captures the primary identifier for the new routine directly from the input model.
  routineName: string = '';
  
  // routineDescription: Stores contextual notes or instructions for the workout plan.
  routineDescription: string = '';
  
  // selectedObjective: Binds to the UI select element to categorize the routine's primary fitness goal.
  selectedObjective: string = 'Hipertrofia (Músculo)';
  
  // objectiveList: Static array defining the domain of valid fitness objectives.
  objectiveList: string[] = [
    'Hipertrofia (Músculo)', 
    'Fuerza Máxima', 
    'Pérdida de Peso', 
    'Resistencia / Cardio', 
    'Salud y Movilidad'
  ];

  // exerciseCatalog: Array of available exercises fetched dynamically from the backend database.
  exerciseCatalog: any[] = [];
  
  // routineExercises: Dynamic array managing the specific exercises, sets, and reps configured for the current routine.
  routineExercises: any[] = [];

  // Dependency injection for HTTP services, routing manipulation, and explicit change detection.
  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // Component initialization lifecycle hook. Triggers the database catalog fetch upon rendering.
  ngOnInit() {
    this.loadExerciseCatalog();
  }

  // Executes an HTTP GET request to retrieve the global exercise dictionary.
  // Maps backend DTO properties to a consistent frontend model architecture.
  loadExerciseCatalog() {
    this.profileService.getExercises().subscribe({
      next: (res: any[]) => {
        this.exerciseCatalog = res.map(e => ({
          id_exercise: e.idExercise || e.id_exercise || e.IdExercise,
          name: e.name || e.Name,
          muscle_group: e.muscleGroup || e.muscle_group || e.MuscleGroup
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error retrieving exercise catalog:", err);
      }
    });
  }

  // Mutates the state array by appending a default exercise configuration object.
  addExerciseRow() {
    this.routineExercises.push({
      id_exercise: 0, 
      series: 3,
      repetitions: 12,
      rest: 60
    });
  }

  // Mutates the state array by removing an exercise configuration object at the specified index.
  removeExerciseRow(index: number) {
    this.routineExercises.splice(index, 1);
  }

  // Validates the component state and constructs the structured payload for backend submission.
  saveRoutine() {
    if (!this.routineName || this.routineExercises.length === 0) {
      alert("Por favor, completa el nombre y añade ejercicios.");
      return;
    }

    // Payload construction matching the C# CreateRoutineDto mapping constraints.
    const payload = {
      Name: this.routineName,
      Description: `[${this.selectedObjective}] ${this.routineDescription}`,
      Exercises: this.routineExercises.map(e => ({
        IdExercise: Number(e.id_exercise),
        Series: e.series,
        Repetitions: e.repetitions,
        Rest: e.rest
      }))
    };

    // Executes HTTP POST to persist the new routine to the relational database.
    this.profileService.createFullRoutine(payload).subscribe({
      next: () => {
        alert("✅ Rutina guardada correctamente.");
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error("Error persisting routine:", err);
        alert("Error al guardar en la base de datos.");
      }
    });
  }
}