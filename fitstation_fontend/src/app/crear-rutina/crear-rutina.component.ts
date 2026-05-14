import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-crear-rutina',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crear-rutina.component.html',
  styleUrls: ['./crear-rutina.component.css']
})
export class CrearRutinaComponent implements OnInit {
  workerId: number = 0;
  
  // Datos Generales de la Rutina
  routineName: string = '';
  routineDesc: string = '';

  // Ejercicios
  ejerciciosBase: any[] = []; // Los que vienen de la Base de Datos
  ejerciciosFiltrados: any[] = [];
  textoBusqueda: string = '';

  // Lista temporal que el coach está montando
  rutinaMontada: any[] = [];
  guardando: boolean = false;

  constructor(private profileService: ProfileService, private router: Router) {}

  ngOnInit() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        if (res.role !== 'worker') {
          alert('Solo los entrenadores pueden crear rutinas.');
          this.router.navigate(['/dashboard']);
          return;
        }
        this.workerId = res.details.idWorker || res.details.IdWorker;
        this.cargarEjerciciosBase();
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  cargarEjerciciosBase() {
    this.profileService.getExercises().subscribe(data => {
      this.ejerciciosBase = data;
      this.ejerciciosFiltrados = data;
    });
  }

  filtrarEjercicios() {
    const term = this.textoBusqueda.toLowerCase();
    this.ejerciciosFiltrados = this.ejerciciosBase.filter(e => 
      e.name.toLowerCase().includes(term) || 
      (e.muscleGroup && e.muscleGroup.toLowerCase().includes(term))
    );
  }

  anadirARutina(ejercicio: any) {
    // Añadimos una copia a la lista de montaje con valores por defecto
    this.rutinaMontada.push({
      idExercise: ejercicio.idExercise,
      name: ejercicio.name,
      muscleGroup: ejercicio.muscleGroup,
      sets: 4,
      reps: 12,
      restSeconds: 90
    });
  }

  eliminarDeRutina(index: number) {
    this.rutinaMontada.splice(index, 1);
  }

  guardarRutinaCompleta() {
    if (!this.routineName.trim()) {
      alert("⚠️ Ponle un nombre a la rutina.");
      return;
    }
    if (this.rutinaMontada.length === 0) {
      alert("⚠️ Añade al menos un ejercicio.");
      return;
    }

    this.guardando = true;

    const payloadRutina = {
      IdWorker: this.workerId,
      Name: this.routineName,
      Description: this.routineDesc
    };

    // 1. Crear la Rutina Base
    this.profileService.createRoutine(payloadRutina).subscribe({
      next: (res: any) => {
        const idRoutine = res.idRoutine || res.IdRoutine;
        
        // 2. Asociarle todos los ejercicios
        let guardados = 0;
        this.rutinaMontada.forEach(ej => {
          const payloadEjercicio = {
            IdRoutine: idRoutine,
            IdExercise: ej.idExercise,
            Sets: ej.sets,
            Reps: ej.reps,
            RestSeconds: ej.restSeconds
          };

          this.profileService.addExerciseToRoutine(payloadEjercicio).subscribe(() => {
            guardados++;
            // Cuando acabe el bucle, volvemos al dashboard
            if (guardados === this.rutinaMontada.length) {
              alert("✅ ¡Rutina creada y guardada con éxito!");
              this.guardando = false;
              this.router.navigate(['/dashboard']);
            }
          });
        });
      },
      error: (err) => {
        alert("Error al crear la rutina.");
        this.guardando = false;
      }
    });
  }
}