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
  // routineName: Captura el identificador principal de la nueva rutina directamente desde el modelo del input.
  routineName: string = '';
  
  // routineDescription: Almacena notas contextuales o instrucciones para el plan de entrenamiento.
  routineDescription: string = '';
  
  // selectedObjective: Se vincula al elemento select de la UI para categorizar el objetivo físico principal de la rutina.
  selectedObjective: string = 'Hipertrofia (Músculo)';
  
  // objectiveList: Array estático que define el dominio de objetivos físicos válidos.
  objectiveList: string[] = [
    'Hipertrofia (Músculo)', 
    'Fuerza Máxima', 
    'Pérdida de Peso', 
    'Resistencia / Cardio', 
    'Salud y Movilidad'
  ];

  // exerciseCatalog: Array de ejercicios disponibles obtenidos dinámicamente de la base de datos del backend.
  exerciseCatalog: any[] = [];
  
  // routineExercises: Array dinámico que gestiona los ejercicios específicos, series y repeticiones configurados para la rutina actual.
  routineExercises: any[] = [];

  // Inyección de dependencias para servicios HTTP, manipulación de rutas y detección de cambios explícita.
  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // Hook del ciclo de vida de inicialización del componente. Dispara la obtención del catálogo de la base de datos al renderizar.
  ngOnInit() {
    this.loadExerciseCatalog();
  }

  // Ejecuta una petición HTTP GET para recuperar el diccionario global de ejercicios.
  // Mapea las propiedades del DTO del backend a una arquitectura de modelo consistente en el frontend.
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
        console.error("Error al recuperar el catálogo de ejercicios:", err);
      }
    });
  }

  // Muta el array de estado añadiendo un objeto de configuración de ejercicio predeterminado.
  addExerciseRow() {
    this.routineExercises.push({
      id_exercise: 0, 
      series: 3,
      repetitions: 12,
      rest: 60
    });
  }

  // Muta el array de estado eliminando un objeto de configuración de ejercicio en el índice especificado.
  removeExerciseRow(index: number) {
    this.routineExercises.splice(index, 1);
  }

  // Valida el estado del componente y construye el payload estructurado para el envío al backend.
  saveRoutine() {
    if (!this.routineName || this.routineExercises.length === 0) {
      alert("Por favor, completa el nombre y añade ejercicios.");
      return;
    }

    // Construcción del payload coincidiendo con las restricciones de mapeo del CreateRoutineDto en C#.
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

    // Ejecuta HTTP POST para persistir la nueva rutina en la base de datos relacional.
    this.profileService.createFullRoutine(payload).subscribe({
      next: () => {
        alert("✅ Rutina guardada correctamente.");
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error("Error al persistir la rutina:", err);
        alert("Error al guardar en la base de datos.");
      }
    });
  }
}