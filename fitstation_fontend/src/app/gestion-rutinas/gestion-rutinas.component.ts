import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-gestion-rutinas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './gestion-rutinas.component.html',
  styleUrls: ['./gestion-rutinas.component.css']
})
export class GestionRutinasComponent implements OnInit {
  sessionId!: number;
  idCliente!: number;
  idWorker!: number;
  nombreAlumno: string = 'Cargando...';

  // Datos de tu DB
  bibliotecaRutinas: any[] = []; // Viene de tabla 'routines'
  rutinasDelAlumno: any[] = []; // Viene de tabla 'client_routines'
  
  // Para el visualizador de ejercicios
  detallesRutinaSeleccionada: any[] = []; // Viene de 'routine_exercises'
  mostrandoEjercicios: boolean = false;
  nombreRutinaViendo: string = '';

  rutinaParaAsignarId: number = 0;
  cargando: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatosSesion();
  }

  cargarDatosSesion() {
    // Obtenemos IDs de la sesión para saber qué cargar
    this.profileService.getSessionDetails(this.sessionId).subscribe({
      next: (res: any) => {
        const s = res.session || res.Session;
        this.idCliente = s.idClient || s.IdClient;
        this.idWorker = s.idWorker || s.IdWorker;
        this.nombreAlumno = res.otherName || res.OtherName;
        
        this.cargarBiblioteca();
        this.cargarRutinasAlumno();
      }
    });
  }

  cargarBiblioteca() {
    // Carga las rutinas que el worker creó (Tabla: routines)
    this.profileService.getWorkerRoutines(this.idWorker).subscribe(res => {
      this.bibliotecaRutinas = res;
      this.cdr.detectChanges();
    });
  }

  cargarRutinasAlumno() {
    // Carga las rutinas que ya tiene el alumno (Tabla: client_routines)
    this.profileService.getClientRoutines(this.idCliente).subscribe(res => {
      this.rutinasDelAlumno = res;
      this.cargando = false;
      this.cdr.detectChanges();
    });
  }

  verContenidoRutina(id: number, nombre: string) {
    // Consulta la tabla 'routine_exercises' para ver qué ejercicios tiene
    this.nombreRutinaViendo = nombre;
    this.profileService.getRoutineDetails(id).subscribe(exs => {
      this.detallesRutinaSeleccionada = exs;
      this.mostrandoEjercicios = true;
      this.cdr.detectChanges();
    });
  }

  asignarRutina() {
    if (this.rutinaParaAsignarId == 0) return;

    const payload = {
      IdClient: this.idCliente,
      IdRoutine: Number(this.rutinaParaAsignarId)
    };

    // Inserta en la tabla 'client_routines'
    this.profileService.assignRoutineToClient(payload).subscribe({
      next: () => {
        alert("✅ Rutina enviada al alumno correctamente.");
        this.rutinaParaAsignarId = 0;
        this.cargarRutinasAlumno();
      },
      error: () => alert("Error al asignar. Verifica la conexión.")
    });
  }

  cerrarModal() {
    this.mostrandoEjercicios = false;
  }
}