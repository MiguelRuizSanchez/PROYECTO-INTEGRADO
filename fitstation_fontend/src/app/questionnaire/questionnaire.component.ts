import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.css'
})
export class QuestionnaireComponent implements OnInit {
  nombreRutina: string = '';
  descripcion: string = '';
  objetivoSeleccionado: string = 'Hipertrofia (Músculo)';
  listaObjetivos: string[] = ['Hipertrofia (Músculo)', 'Fuerza Máxima', 'Pérdida de Peso', 'Resistencia / Cardio', 'Salud y Movilidad'];

  catalogoEjercicios: any[] = [];
  ejerciciosEnRutina: any[] = [];

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarEjercicios();
  }

  cargarEjercicios() {
    this.profileService.getExercises().subscribe({
      next: (res) => {
        this.catalogoEjercicios = res.map(e => ({
          id_exercise: e.idExercise || e.id_exercise,
          name: e.name || e.Name,
          muscle: e.muscleGroup || e.muscle_group
        }));
        this.cdr.detectChanges();
      }
    });
  }

  agregarFilaEjercicio() {
    this.ejerciciosEnRutina.push({ id_exercise: 0, series: 3, repetitions: 12, rest: 60 });
  }

  quitarFila(index: number) {
    this.ejerciciosEnRutina.splice(index, 1);
  }

  guardarRutina() {
    if (!this.nombreRutina || this.ejerciciosEnRutina.length === 0) {
      alert("Introduce un nombre y al menos un ejercicio.");
      return;
    }

    const payload = {
      Name: this.nombreRutina,
      Description: `[${this.objetivoSeleccionado}] ${this.descripcion}`,
      Exercises: this.ejerciciosEnRutina.map(e => ({
        IdExercise: Number(e.id_exercise),
        Series: e.series,
        Repetitions: e.repetitions,
        Rest: e.rest
      }))
    };

    this.profileService.createFullRoutine(payload).subscribe({
      next: () => {
        alert(" Rutina guardada correctamente.");
        this.router.navigate(['/dashboard']);
      },
      error: (err) => alert("Error al guardar: " + err.error)
    });
  }
}
