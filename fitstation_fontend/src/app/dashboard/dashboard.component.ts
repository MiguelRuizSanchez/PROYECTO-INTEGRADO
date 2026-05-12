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
  perfilIncompleto: boolean = false;
  cargando: boolean = true;

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
        const role = (res?.role || res?.Role || '').toLowerCase().trim();
        const d = res?.details || res?.Details;

        // Lógica de perfil incompleto basada en tu SQL
        if (role === 'worker') {
          this.perfilIncompleto = !d?.specialization && !d?.Specialization;
          if (!this.perfilIncompleto) {
            const workerId = d?.id_worker || d?.idWorker || d?.IdWorker;
            this.cargarDatosWorker(workerId);
          }
        } else {
          this.perfilIncompleto = !d?.objectives && !d?.Objectives;
          if (!this.perfilIncompleto) {
            const clientId = d?.id_client || d?.idClient || d?.IdClient;
            this.cargarDatosClient(clientId);
          }
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.router.navigate(['/login']);
      }
    });
  }

  cargarDatosWorker(id: number) {
    if (!id) return;
    this.profileService.getWorkerRequests(id).subscribe(reqs => {
      this.solicitudes = reqs.filter((r: any) => (r.status || r.Status) === 'Pending');
      this.cdr.detectChanges();
    });
    this.profileService.getWorkerSessions(id).subscribe(sess => {
      this.sesiones = sess;
      this.cdr.detectChanges();
    });
  }

  cargarDatosClient(id: number) {
    if (!id) return;
    this.profileService.getClientSessions(id).subscribe(sess => {
      this.sesiones = sess;
      this.cdr.detectChanges();
    });
  }

  gestionarSolicitud(requestId: number, status: string) {
    this.profileService.updateStatus(requestId, status).subscribe(() => {
      this.cargarDashboard();
    });
  }

  irAlBuscador() { this.router.navigate(['/buscador']); }
  irAlCuestionario() { this.router.navigate(['/cuestionario']); }
  
  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}