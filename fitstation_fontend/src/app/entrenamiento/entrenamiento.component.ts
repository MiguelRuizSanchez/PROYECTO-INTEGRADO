import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../profile.service';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-entrenamiento',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './entrenamiento.component.html',
  styleUrls: ['./entrenamiento.component.css']
})
export class EntrenamientoComponent implements OnInit {
  sessionId!: number;
  idCliente!: number;
  nombreCoach: string = 'Cargando Coach...';

  rutinasAsignadas: any[] = [];
  rutinaSeleccionada: any = null;
  ejerciciosDeLaRutina: any[] = [];
  cargando: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Obtenemos el ID de la sesión de la URL de forma segura
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatosSesion();
  }

  cargarDatosSesion() {
    // 1. Buscamos de quién es esta sesión para saber qué rutinas cargar
    this.profileService.getSessionDetails(this.sessionId).subscribe({
      next: (res: any) => {
        // 🚀 Comprobamos si 'res' tiene el ID directamente
        if (res && (res.idClient || res.IdClient)) {
          this.idCliente = res.idClient || res.IdClient;
          this.nombreCoach = res.nombre || res.Nombre || 'Entrenador';
          this.cargarListaRutinas();
        } else {
          this.nombreCoach = 'Entrenador';
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.nombreCoach = 'Entrenador';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarListaRutinas() {
    // 2. Traemos todas las rutinas que el coach ha enviado a este alumno
    this.profileService.getClientRoutines(this.idCliente).subscribe({
      next: (res) => {
        this.rutinasAsignadas = res || [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error cargando biblioteca del alumno:", err);
        this.rutinasAsignadas = [];
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  verDetalle(rutina: any) {
    this.rutinaSeleccionada = rutina;
    const idRutina = rutina.idRoutine || rutina.IdRoutine;

    // 3. Traemos los ejercicios específicos (series, repes, músculo...) de esa rutina
    this.profileService.getRoutineDetails(idRutina).subscribe({
      next: (exs) => {
        this.ejerciciosDeLaRutina = exs || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al descargar ejercicios de la rutina:", err);
        this.ejerciciosDeLaRutina = [];
        this.cdr.detectChanges();
      }
    });
  }

  cerrarDetalle() {
    this.rutinaSeleccionada = null;
    this.ejerciciosDeLaRutina = [];
    this.cdr.detectChanges();
  }
}
