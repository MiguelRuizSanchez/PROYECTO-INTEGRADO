import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../profile.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.css']
})
export class BuscadorComponent implements OnInit {
  coaches: any[] = [];
  cargando: boolean = true;
  clientId: number = 0;
  esWorker: boolean = false;

  constructor(
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        const role = (res?.role || res?.Role || '').toLowerCase();
        const d = res?.details || res?.Details;
        let perfilIncompleto = false;

        if (role === 'worker') {
          this.esWorker = true;
          perfilIncompleto = !d || (!d.bio && !d.Bio);
        } else {
          perfilIncompleto = !d || (!d.objectives && !d.Objectives);
          this.clientId = d?.idClient || d?.IdClient;
        }

        // BLOQUEO DE SEGURIDAD
        if (perfilIncompleto) {
          alert("🛑 ¡Alto ahí! Debes completar tu perfil antes de buscar o recibir matches.");
          this.router.navigate(['/cuestionario']);
          return; 
        }

        if (!this.esWorker && this.clientId) {
          this.cargarSugerencias();
        } else {
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  cargarSugerencias() {
    this.profileService.getSuggestedWorkers(this.clientId).subscribe({
      next: (data: any[]) => {
        this.coaches = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error("Error cargando matches:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  enviarSolicitud(workerId: number) {
    if (!workerId) return;
    
    this.profileService.sendMatchRequest(workerId).subscribe({
      next: (res: any) => {
        alert(res.message || '¡Solicitud de match enviada al entrenador!');
      },
      error: (err: any) => {
        alert(err.error?.message || 'Ya tienes una solicitud pendiente con este perfil.');
      }
    });
  }
}