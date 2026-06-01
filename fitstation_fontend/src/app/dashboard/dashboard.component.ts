import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../profile.service';
import { ClassService } from '../class.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Variables de estado del componente
  // userData: Almacena la informacion principal del usuario recuperada desde el backend.
  userData: any = null;
  
  // pendingRequests: Array que contiene las peticiones de entrenamiento 1-a-1 pendientes de aprobar (vista Worker).
  pendingRequests: any[] = []; 
  
  // activeSessions: Coleccion de las sesiones de entrenamiento programadas y en curso.
  activeSessions: any[] = [];    
  
  // weeklyClasses: Almacena el listado de clases colectivas (grupales) agendadas para la semana actual.
  weeklyClasses: any[] = []; 
  
  // sentRequests: Array de solicitudes emitidas por el cliente que aun no han sido respondidas (vista Client).
  sentRequests: any[] = []; 
  
  // isIncompleteProfile: Bandera booleana que bloquea la interfaz si faltan datos obligatorios en el registro.
  isIncompleteProfile: boolean = false; 
  
  // isLoading: Controla la visualizacion del indicador de carga mientras se resuelven las promesas HTTP.
  isLoading: boolean = true; 
  
  // userRole: Define el nivel de acceso actual ('worker' o 'client') para renderizar condicionalmente el DOM.
  userRole: string = ''; 

  // Inyeccion de dependencias en el constructor para servicios de datos y navegacion.
  constructor(
    private profileService: ProfileService, 
    private classService: ClassService, 
    private router: Router, 
    private cdr: ChangeDetectorRef
  ) {}

  // Metodo del ciclo de vida de Angular. Se ejecuta inmediatamente despues de inicializar el componente.
  ngOnInit() { 
    this.loadDashboardData(); 
  }

  // Metodo principal de orquestacion de datos.
  // Realiza la llamada HTTP primaria para obtener el perfil y decide que flujos de datos cargar segun el rol.
  loadDashboardData() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        this.userData = res; 
        this.userRole = (res?.role || res?.Role || '').toLowerCase().trim(); 
        const details = res?.details || res?.Details || {}; 
        const internalId = details?.idClient || details?.IdClient || details?.idWorker || details?.IdWorker || 0; 

        // Validacion estricta de completitud de perfil segun el rol del usuario.
        if (this.userRole === 'worker') {
          const spec = details?.specialization || details?.Specialization || details?.specialty || details?.Specialty || '';
          this.isIncompleteProfile = (spec.trim() === ''); 
          
          if (!this.isIncompleteProfile) {
            this.loadWorkerData(internalId); 
          }
        } else if (this.userRole === 'client') {
          const obj = details?.objectives || details?.Objectives || '';
          this.isIncompleteProfile = (obj.trim() === ''); 
          
          if (!this.isIncompleteProfile) {
            this.loadClientData(internalId); 
          }
        }

        this.isLoading = false; 
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Error retrieving dashboard data:", err);
        this.logout(); 
      }
    });
  }

  // Metodo especifico para cargar las entidades asociadas al rol de Entrenador.
  // Realiza multiples suscripciones a observables para construir la vista del trabajador.
  loadWorkerData(id: number) {
    this.profileService.getWorkerRequests(id).subscribe(reqs => {
      this.pendingRequests = reqs.filter(r => (r.status || r.Status) === 'Pending'); 
      this.cdr.detectChanges(); 
    });
    
    this.profileService.getWorkerSessions(id).subscribe(sess => {
      this.activeSessions = sess; 
      this.cdr.detectChanges(); 
    });

    this.classService.getWorkerClassCalendar().subscribe({
      next: (classes) => {
        this.weeklyClasses = classes || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error loading worker classes:", err)
    });
  }

  // Metodo especifico para cargar las entidades asociadas al rol de Cliente.
  loadClientData(id: number) {
    this.profileService.getClientSessions(id).subscribe(sess => {
      this.activeSessions = sess; 
      this.cdr.detectChanges(); 
    });

    this.profileService.getClientRequests(id).subscribe(reqs => {
      this.sentRequests = reqs.filter(r => (r.status || r.Status) === 'Pending'); 
      this.cdr.detectChanges(); 
    });

    this.classService.getClientClassCalendar().subscribe({
      next: (classes) => {
        this.weeklyClasses = classes || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error loading client bookings:", err)
    });
  }

  // Gestiona el cambio de estado de una peticion (Aceptar o Rechazar).
  // Se comunica con el backend mediante peticion PUT y recarga el panel si tiene exito.
  manageRequestStatus(requestId: number, status: string) {
    this.profileService.updateStatus(requestId, status).subscribe({
      next: () => {
        alert(`Petición ${status === 'Accepted' ? 'Aceptada' : 'Rechazada'} correctamente.`); 
        this.loadDashboardData(); 
      },
      error: (err) => alert("Error updating request status.") 
    });
  }

  // Ejecuta la finalizacion de una sesion de entrenamiento, marcando su estado como completado en la base de datos.
  finishActiveSession(id: number) {
    if (confirm('¿Quieres dar por finalizada esta etapa de entrenamiento? Esto liberará el slot del alumno.')) { 
      this.profileService.finishSession(id).subscribe(() => { 
        const details = this.userData?.details || this.userData?.Details;
        const internalId = details?.idClient || details?.IdClient || details?.idWorker || details?.IdWorker;
        
        if (this.userRole === 'worker') {
          this.loadWorkerData(internalId);
        } else if (this.userRole === 'client') {
          this.loadClientData(internalId);
        }
      });
    }
  }

  // Navegacion programatica hacia el componente de busqueda de entrenadores.
  navigateToSearch() {
    this.router.navigate(['/search']); 
  }

  // Elimina las credenciales almacenadas localmente y redirige al usuario a la vista de autenticacion.
  logout() {
    localStorage.clear(); 
    this.router.navigate(['/login']); 
  }
}