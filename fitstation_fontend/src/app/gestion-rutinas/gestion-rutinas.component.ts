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

  bibliotecaRutinas: any[] = []; // Rutinas creadas por el coach
  rutinasDelAlumno: any[] = []; // Rutinas que el alumno ya tiene asignadas
  rutinaSeleccionadaId: number = 0;
  cargando: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatosBase();
  }

  cargarDatosBase() {
    // 1. Obtenemos detalles de la sesión para identificar al alumno y al coach
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
    // 2. Traemos las rutinas que este coach ha creado en su biblioteca
    this.profileService.getWorkerRoutines(this.idWorker).subscribe(res => {
      this.bibliotecaRutinas = res;
      this.cdr.detectChanges();
    });
  }

  cargarRutinasAlumno() {
    // 3. Traemos lo que el alumno ya tiene asignado para no repetirlo
    this.profileService.getClientRoutines(this.idCliente).subscribe(res => {
      this.rutinasDelAlumno = res;
      this.cargando = false;
      this.cdr.detectChanges();
    });
  }

  asignarRutina() {
    if (this.rutinaSeleccionadaId == 0) return;

    const payload = {
      IdClient: this.idCliente,
      IdRoutine: Number(this.rutinaSeleccionadaId)
    };

    // 4. Realizamos la asignación en la base de datos
    this.profileService.assignRoutineToClient(payload).subscribe({
      next: () => {
        alert(`✅ Rutina asignada con éxito a ${this.nombreAlumno}`);
        this.rutinaSeleccionadaId = 0;
        this.cargarRutinasAlumno(); // Recargamos la lista visual
      },
      error: (err) => alert("Error al asignar: " + (err.error?.message || "Servidor no responde"))
    });
  }
}