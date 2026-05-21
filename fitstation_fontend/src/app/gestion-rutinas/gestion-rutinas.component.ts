import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // 🚀 Importado Router

@Component({
  selector: 'app-gestion-rutinas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gestion-rutinas.component.html',
  styleUrl: './gestion-rutinas.component.css'
})
export class GestionRutinasComponent implements OnInit {
  sessionId!: number;
  clientId!: number;
  nombreAlumno: string = 'Cargando...';
  misRutinas: any[] = [];

  rutinaParaAsignarId: number = 0;
  mostrandoEjercicios: boolean = false;
  nombreRutinaViendo: string = '';
  ejerciciosDeLaRutina: any[] = []; // Array para la vista previa

  constructor(
    private route: ActivatedRoute,
    private router: Router, // 🚀 Inyectamos el enrutador
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatosSesion();
    this.cargarBiblioteca();
  }

  cargarDatosSesion() {
    this.profileService.getSessionDetails(this.sessionId).subscribe({
      next: (res: any) => {
        // 🚀 Leemos directo de "res" (sin la caja 'session')
        this.clientId = res.idClient || res.IdClient || 0;
        // 🚀 Usamos 'nombre' porque así lo envía tu backend de C#
        this.nombreAlumno = res.nombre || res.Nombre || 'Alumno';
        this.cdr.detectChanges();
      },
      error: () => {
        this.nombreAlumno = 'Alumno';
        this.cdr.detectChanges();
      }
    });
  }

  cargarBiblioteca() {
    this.profileService.getWorkerRoutines(0).subscribe({
      next: (res) => {
        this.misRutinas = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error cargando biblioteca:", err)
    });
  }

  verContenidoRutina() {
    const idRutina = Number(this.rutinaParaAsignarId);
    if (!idRutina || idRutina === 0) return;

    const rutinaSeleccionada = this.misRutinas.find(r => (r.idRoutine || r.IdRoutine) === idRutina);
    this.nombreRutinaViendo = rutinaSeleccionada?.name || rutinaSeleccionada?.Name || 'Vista Previa';
    this.mostrandoEjercicios = true;

    this.profileService.getRoutineDetails(idRutina).subscribe({
      next: (ejerciciosDescargados) => {
        this.ejerciciosDeLaRutina = ejerciciosDescargados;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al descargar ejercicios:", err)
    });
  }

  asignarRutina() {
    if (this.rutinaParaAsignarId == 0) {
      alert("Por favor, selecciona una rutina válida.");
      return;
    }

    const payload = {
      IdClient: this.clientId,
      IdRoutine: Number(this.rutinaParaAsignarId)
    };

    this.profileService.assignRoutineToClient(payload).subscribe({
      next: () => {
        alert("✅ Rutina asignada con éxito al alumno.");
        // 🚀 REDIRECCIÓN AUTOMÁTICA AL DASHBOARD
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const errorServidor = err.error?.message || err.error || err.message;
        alert("Error al realizar la asignación: " + errorServidor);
      }
    });
  }

  cerrarModal() {
    this.mostrandoEjercicios = false;
    this.ejerciciosDeLaRutina = [];
    this.cdr.detectChanges();
  }
}
