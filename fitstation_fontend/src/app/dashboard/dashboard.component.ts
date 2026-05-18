import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../profile.service';
import { ClassService } from '../class.service'; // 🚀 Conectamos el servicio de clases colectivas
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
  sesiones: any[] = [];    // Sesiones privadas activas para ambos
  clasesDashboard: any[] = []; // 🚀 NUEVO: Almacena las clases grupales para el panel principal
  peticionesEnviadas: any[] = []; // Peticiones que el cliente ha mandado
  perfilIncompleto: boolean = false; //
  cargando: boolean = true; //
  rol: string = ''; //

  constructor(
    private profileService: ProfileService, 
    private classService: ClassService, // 🚀 Inyectamos el servicio de clases
    private router: Router, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { 
    this.cargarDashboard(); //
  }

  cargarDashboard() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        this.datosUsuario = res; //
        this.rol = (res?.role || res?.Role || '').toLowerCase().trim(); //
        const d = res?.details || res?.Details; //
        const idInterno = d?.idClient || d?.IdClient || d?.idWorker || d?.IdWorker; //

        if (this.rol === 'worker') {
          this.perfilIncompleto = !(d?.specialization || d?.Specialization || d?.bio || d?.Bio); //
          if (!this.perfilIncompleto) this.cargarDatosWorker(idInterno); //
        } else if (this.rol === 'client') {
          this.perfilIncompleto = !(d?.objectives || d?.Objectives); //
          if (!this.perfilIncompleto) this.cargarDatosClient(idInterno); //
        }

        this.cargando = false; //
        this.cdr.detectChanges(); //
      },
      error: () => {
        this.logout(); //
      }
    });
  }

  cargarDatosWorker(id: number) {
    this.profileService.getWorkerRequests(id).subscribe(reqs => {
      this.solicitudes = reqs.filter(r => (r.status || r.Status) === 'Pending'); //
      this.cdr.detectChanges(); //
    });
    
    this.profileService.getWorkerSessions(id).subscribe(sess => {
      this.sesiones = sess; //
      this.cdr.detectChanges(); //
    });

    // 🚀 NUEVO: Sincronizamos las clases grupales asignadas por fechas en el Dashboard del Coach
    this.classService.getWorkerClassCalendar().subscribe({
      next: (clases) => {
        this.clasesDashboard = clases || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error cargando clases del worker en dashboard:", err)
    });
  }

  cargarDatosClient(id: number) {
    this.profileService.getClientSessions(id).subscribe(sess => {
      this.sesiones = sess; //
      this.cdr.detectChanges(); //
    });

    this.profileService.getClientRequests(id).subscribe(reqs => {
      this.peticionesEnviadas = reqs.filter(r => (r.status || r.Status) === 'Pending'); //
      this.cdr.detectChanges(); //
    });

    // 🚀 NUEVO: Sincronizamos las reservas físicas que el alumno tiene hechas
    this.classService.getClientClassCalendar().subscribe({
      next: (clases) => {
        this.clasesDashboard = clases || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error cargando reservas del cliente en dashboard:", err)
    });
  }

  gestionarSolicitud(requestId: number, status: string) {
    this.profileService.updateStatus(requestId, status).subscribe({
      next: () => {
        alert(`Petición ${status === 'Accepted' ? 'Aceptada' : 'Rechazada'} correctamente.`); //
        this.cargarDashboard(); //
      },
      error: (err) => alert("Error al actualizar la petición.") //
    });
  }

  finalizarSesion(id: number) {
    if (confirm('¿Quieres dar por finalizada esta etapa de entrenamiento? Esto liberará el slot del alumno.')) { //
      this.profileService.finishSession(id).subscribe(() => { //
        const d = this.datosUsuario?.details || this.datosUsuario?.Details;
        const idInterno = d?.idClient || d?.IdClient || d?.idWorker || d?.IdWorker;
        
        // Refresco quirúrgico inmediato de la cuadrícula
        if (this.rol === 'worker') {
          this.cargarDatosWorker(idInterno);
        } else if (this.rol === 'client') {
          this.cargarDatosClient(idInterno);
        }
      });
    }
  }

  irAlBuscador() {
    this.router.navigate(['/buscador']); //
  }

  logout() {
    localStorage.clear(); //
    this.router.navigate(['/login']); //
  }
}