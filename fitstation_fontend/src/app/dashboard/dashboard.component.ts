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
  solicitudes: any[] = [];
  sesiones: any[] = [];
  peticionesEnviadas: any[] = []; // 🚀 NUEVO
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
        this.rol = (res?.role || res?.Role || '').toLowerCase().trim();
        const d = res?.details || res?.Details;

        if (this.rol === 'worker') {
          this.perfilIncompleto = !d?.specialization && !d?.Specialization;
          if (!this.perfilIncompleto) {
            this.cargarDatosWorker(d.idWorker || d.IdWorker);
          }
        } else {
          this.perfilIncompleto = !d?.objectives && !d?.Objectives;
          if (!this.perfilIncompleto) {
            this.cargarDatosClient(d.idClient || d.IdClient);
          }
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  cargarDatosWorker(id: number) {
    this.profileService.getWorkerRequests(id).subscribe(reqs => {
      this.solicitudes = reqs.filter(r => r.status === 'Pending' || r.Status === 'Pending');
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

    // 🚀 NUEVO: Cargar peticiones pendientes enviadas por el cliente
    this.profileService.getClientRequests(id).subscribe(reqs => {
      this.peticionesEnviadas = reqs.filter(r => r.status === 'Pending' || r.Status === 'Pending');
      this.cdr.detectChanges();
    });
  }

  gestionarSolicitud(requestId: number, status: string) {
    this.profileService.updateStatus(requestId, status).subscribe(() => {
      alert(`Petición ${status === 'Accepted' ? 'Aceptada' : 'Rechazada'}`);
      this.cargarDashboard();
    });
  }

  finalizarSesion(id: number) {
    if (confirm('¿Quieres dar por finalizada esta etapa de entrenamiento? Esto liberará el slot del alumno.')) {
      this.profileService.finishSession(id).subscribe(() => {
        this.cargarDashboard();
      });
    }
  }

  irAlBuscador() { this.router.navigate(['/buscador']); }
  irAlCuestionario() { this.router.navigate(['/cuestionario']); }
  logout() { localStorage.clear(); this.router.navigate(['/login']); }
}