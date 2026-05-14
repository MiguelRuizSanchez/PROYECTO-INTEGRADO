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
  nombreCoach: string = '';
  
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
    // Obtenemos el ID de la sesión de la URL
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatosSesion();
  }

  cargarDatosSesion() {
    // 1. Buscamos de quién es esta sesión para saber qué rutinas cargar
    this.profileService.getSessionDetails(this.sessionId).subscribe({
      next: (res: any) => {
        const s = res.session || res.Session;
        this.idCliente = s.idClient || s.IdClient;
        this.nombreCoach = res.otherName || res.OtherName;
        this.cargarListaRutinas();
      }
    });
  }

  cargarListaRutinas() {
    // 2. Traemos todas las rutinas que el coach ha enviado a este alumno
    this.profileService.getClientRoutines(this.idCliente).subscribe(res => {
      this.rutinasAsignadas = res;
      this.cargando = false;
      this.cdr.detectChanges();
    });
  }

  verDetalle(rutina: any) {
    this.rutinaSeleccionada = rutina;
    const idRutina = rutina.idRoutine || rutina.IdRoutine;

    // 3. Traemos los ejercicios específicos (series, repes, músculo...) de esa rutina
    this.profileService.getRoutineDetails(idRutina).subscribe(exs => {
      this.ejerciciosDeLaRutina = exs;
      this.cdr.detectChanges();
    });
  }

  cerrarDetalle() {
    this.rutinaSeleccionada = null;
    this.ejerciciosDeLaRutina = [];
  }
}