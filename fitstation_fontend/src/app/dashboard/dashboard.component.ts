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
  solicitudes: any[] = []; 
  sesiones: any[] = [];    
  clasesDashboard: any[] = []; 
  peticionesEnviadas: any[] = []; 
  perfilIncompleto: boolean = false; 
  cargando: boolean = true; 
  rol: string = ''; 

  constructor(
    private profileService: ProfileService, 
    private classService: ClassService, 
    private router: Router, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { 
    this.cargarDashboard(); 
  }

  cargarDashboard() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        // 🚀 CHIVATO: Esto imprimirá en la consola (F12) lo que lee de MySQL
        console.log("📥 Datos recibidos en el Dashboard:", res); 

        this.datosUsuario = res; 
        this.rol = (res?.role || res?.Role || '').toLowerCase().trim(); 
        const d = res?.details || res?.Details || {}; 
        const idInterno = d?.idClient || d?.IdClient || d?.idWorker || d?.IdWorker || 0; 

        // 🚀 BLINDAJE: Evaluación explícita e irrompible
        if (this.rol === 'worker') {
          // Buscamos la especialidad en todas sus formas posibles y la convertimos a texto seguro
          const spec = d?.specialization || d?.Specialization || d?.specialty || d?.Specialty || '';
          
          // Solo es incompleto si el texto está estrictamente vacío
          this.perfilIncompleto = (spec.trim() === ''); 
          
          if (!this.perfilIncompleto) {
            this.cargarDatosWorker(idInterno); 
          }
        } else if (this.rol === 'client') {
          const obj = d?.objectives || d?.Objectives || '';
          this.perfilIncompleto = (obj.trim() === ''); 
          
          if (!this.perfilIncompleto) {
            this.cargarDatosClient(idInterno); 
          }
        }

        this.cargando = false; 
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("❌ Error cargando dashboard:", err);
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
      this.sesiones = sess; 
      this.cdr.detectChanges(); 
    });

    this.profileService.getClientRequests(id).subscribe(reqs => {
      this.peticionesEnviadas = reqs.filter(r => (r.status || r.Status) === 'Pending'); 
      this.cdr.detectChanges(); 
    });

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
        alert(`Petición ${status === 'Accepted' ? 'Aceptada' : 'Rechazada'} correctamente.`); 
        this.cargarDashboard(); 
      },
      error: (err) => alert("Error al actualizar la petición.") 
    });
  }

  finalizarSesion(id: number) {
    if (confirm('¿Quieres dar por finalizada esta etapa de entrenamiento? Esto liberará el slot del alumno.')) { 
      this.profileService.finishSession(id).subscribe(() => { 
        const d = this.datosUsuario?.details || this.datosUsuario?.Details;
        const idInterno = d?.idClient || d?.IdClient || d?.idWorker || d?.IdWorker;
        
        if (this.rol === 'worker') {
          this.cargarDatosWorker(idInterno);
        } else if (this.rol === 'client') {
          this.cargarDatosClient(idInterno);
        }
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