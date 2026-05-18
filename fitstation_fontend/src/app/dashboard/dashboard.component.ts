import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../profile.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  datosUsuario: any = null;
  solicitudes: any[] = []; // Peticiones para el Coach
  sesiones: any[] = [];    // Sesiones activas para ambos
  peticionesEnviadas: any[] = []; // Peticiones que el cliente ha mandado
  perfilIncompleto: boolean = false;
  cargando: boolean = true;
  rol: string = '';

  constructor(
    private profileService: ProfileService, 
    private router: Router, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { 
    this.cargarDashboard(); 
  }

  cargarDashboard() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        this.datosUsuario = res;
        // Normalizamos el rol a minúsculas para evitar cualquier conflicto de lectura
        this.rol = (res?.role || res?.Role || '').toLowerCase().trim();
        const d = res?.details || res?.Details;
        const idInterno = d?.idClient || d?.IdClient || d?.idWorker || d?.IdWorker;

        // Verificación automatizada del estado del perfil
        if (this.rol === 'worker') {
          this.perfilIncompleto = !(d?.specialization || d?.Specialization || d?.bio || d?.Bio);
          if (!this.perfilIncompleto) this.cargarDatosWorker(idInterno);
        } else if (this.rol === 'client') {
          this.perfilIncompleto = !(d?.objectives || d?.Objectives);
          if (!this.perfilIncompleto) this.cargarDatosClient(idInterno);
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.logout();
      }
    });
  }

  cargarDatosWorker(id: number) {
    this.profileService.getWorkerRequests(id).subscribe(reqs => {
      this.solicitudes = reqs.filter(r => (r.status || r.Status) === 'Pending');
      this.cdr.detectChanges();
    });
    this.profileService.getWorkerSessions(id).subscribe(sess => {
      this.sesiones = sess;
      this.cdr.detectChanges();
    });
  }

  cargarDatosClient(id: number) {
    this.profileService.getClientSessions(id).subscribe(sess => {
      this.sesiones = sess;
      this.cdr.detectChanges();
    });
    this.profileService.getClientRequests(id).subscribe(reqs => {
      this.peticionesEnviadas = reqs.filter(r => (r.status || r.Status) === 'Pending');
      this.cdr.detectChanges();
    });
  }

  gestionarSolicitud(requestId: number, status: string) {
    this.profileService.updateStatus(requestId, status).subscribe({
      next: () => {
        alert(`Petición ${status === 'Accepted' ? 'Aceptada' : 'Rechazada'} correctamente.`);
        this.cargarDashboard();
      },
      error: (err) => alert("Error al actualizar la petición.")
    });
  }

  finalizarSesion(id: number) {
    if (confirm('¿Quieres dar por finalizada esta etapa de entrenamiento? Esto liberará el slot del alumno.')) {
      this.profileService.finishSession(id).subscribe(() => {
        this.cargarDashboard();
      });
    }
  }

  irAlBuscador() {
    this.router.navigate(['/buscador']);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}