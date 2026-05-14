import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 🚀 Necesario para ngModel
import { ProfileService } from '../profile.service';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-gestion-rutinas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gestion-rutinas.component.html',
  styleUrl: './gestion-rutinas.component.css'
})
export class GestionRutinasComponent implements OnInit {
  clientId!: number;
  nombreAlumno: string = 'Cargando...';
  misRutinas: any[] = [];
  rutinasDelAlumno: any[] = []; // Para mostrar qué tiene ya puesto
  
  // Variables para la interfaz que pedía tu error
  rutinaParaAsignarId: number = 0;
  mostrandoEjercicios: boolean = false;
  nombreRutinaViendo: string = '';
  detallesRutinaSeleccionada: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    this.clientId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatosAlumno();
    this.cargarBiblioteca();
  }

  cargarDatosAlumno() {
    this.profileService.getUserData().subscribe({
      next: (res: any) => this.nombreAlumno = res.name || res.Name || 'Alumno',
      error: () => this.nombreAlumno = 'Alumno'
    });
  }

  cargarBiblioteca() {
    this.profileService.getWorkerRoutines(0).subscribe(res => this.misRutinas = res);
  }

  asignarRutina() {
    if (this.rutinaParaAsignarId == 0) return;
    const payload = { IdClient: this.clientId, IdRoutine: this.rutinaParaAsignarId };
    this.profileService.assignRoutineToClient(payload).subscribe(() => {
      alert("✅ Rutina asignada con éxito");
    });
  }

  // Funciones de apoyo para el modal que pide tu HTML
  verContenidoRutina(id: number, nombre: string) {
    this.nombreRutinaViendo = nombre;
    this.mostrandoEjercicios = true;
    // Aquí podrías cargar ejercicios específicos si quisieras
  }

  cerrarModal() {
    this.mostrandoEjercicios = false;
  }
}