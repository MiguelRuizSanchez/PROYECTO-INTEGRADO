import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-crear-rutina',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crear-rutina.component.html',
  styleUrls: ['./crear-rutina.component.css']
})
export class CrearRutinaComponent implements OnInit {
  nombreRutina: string = '';
  descripcion: string = '';
  objetivoSeleccionado: string = 'Hipertrofia (Músculo)';
  listaObjetivos: string[] = [
    'Hipertrofia (Músculo)', 
    'Fuerza Máxima', 
    'Pérdida de Peso', 
    'Resistencia / Cardio', 
    'Salud y Movilidad'
  ];

  catalogoEjercicios: any[] = [];
  ejerciciosEnRutina: any[] = [];

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarEjerciciosDeBaseDeDatos();
  }

  cargarEjerciciosDeBaseDeDatos() {
    this.profileService.getExercises().subscribe({
      next: (res: any[]) => {
        // Mapeo para asegurar que los IDs y nombres se lean correctamente
        this.catalogoEjercicios = res.map(e => ({
          id_exercise: e.idExercise || e.id_exercise || e.IdExercise,
          name: e.name || e.Name,
          muscle_group: e.muscleGroup || e.muscle_group || e.MuscleGroup
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al obtener ejercicios:", err);
      }
    });
  }

  agregarFilaEjercicio() {
    this.ejerciciosEnRutina.push({
      id_exercise: 0, 
      series: 3,
      repetitions: 12,
      rest: 60
    });
  }

  quitarFila(index: number) {
    this.ejerciciosEnRutina.splice(index, 1);
  }

  // 🛠️ FUNCIÓN CORREGIDA: Ahora se llama guardarRutina() para coincidir con el HTML
  guardarRutina() {
    if (!this.nombreRutina || this.ejerciciosEnRutina.length === 0) {
      alert("Por favor, completa el nombre y añade ejercicios.");
      return;
    }

    const payload = {
      Name: this.nombreRutina,
      Description: `[${this.objetivoSeleccionado}] ${this.descripcion}`,
      Exercises: this.ejerciciosEnRutina.map(e => ({
        IdExercise: Number(e.id_exercise),
        Series: e.series,        // Mapeado a 'Sets' en C#
        Repetitions: e.repetitions, // Mapeado a 'Reps' en C#
        Rest: e.rest             // Mapeado a 'RestSeconds' en C#
      }))
    };

    this.profileService.createFullRoutine(payload).subscribe({
      next: () => {
        alert("✅ Rutina guardada correctamente.");
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error("Error al guardar:", err);
        alert("Error al guardar en la base de datos.");
      }
    });
  }
}