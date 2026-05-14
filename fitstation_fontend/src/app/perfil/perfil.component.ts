import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  profileForm: FormGroup;
  rol: string = '';
  cargando: boolean = true;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {
    // Inicializamos el formulario con las claves exactas del DTO de C#
    this.profileForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      
      // Campos para el Entrenador (Worker)
      Specialization: [''],
      Bio: [''],
      PricePerSession: [0],
      MaxCapacity: [10],

      // Campos para el Atleta (Client)
      Objectives: [''],
      ExperienceLevel: [''],
      Modality: [''],
      
      // Disponibilidad
      PrefDay: ['Monday'],
      PrefTime: ['10:00']
    });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        // Tu backend puede devolver role/Role y details/Details
        this.rol = (res?.role || res?.Role || '').toLowerCase();
        const d = res?.details || res?.Details;
        
        // Formateamos la hora si viene del backend (ej: "10:00:00" -> "10:00")
        let hora = d?.prefTime || d?.PrefTime || '10:00';
        if (typeof hora === 'string' && hora.includes(':')) {
            hora = hora.substring(0, 5);
        }

        // Mapeamos los datos recibidos a nuestro formulario con claves en Mayúscula
        this.profileForm.patchValue({
          name: res?.name || res?.Name || '',
          email: res?.email || res?.Email || '',
          Specialization: d?.specialization || d?.Specialization || d?.specialty || d?.Specialty || '',
          Bio: d?.bio || d?.Bio || '',
          PricePerSession: d?.pricePerSession || d?.PricePerSession || 0,
          MaxCapacity: d?.maxCapacity || d?.MaxCapacity || 10,
          Objectives: d?.objectives || d?.Objectives || '',
          ExperienceLevel: d?.experienceLevel || d?.ExperienceLevel || 'principiante',
          Modality: d?.modality || d?.Modality || 'presencial',
          PrefDay: d?.prefDay || d?.PrefDay || 'Monday',
          PrefTime: hora
        });
        
        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Error al cargar perfil:", err);
        this.cargando = false;
        this.cdr.detectChanges();
        alert("Fallo al conectar con el servidor.");
      }
    });
  }

  guardar() {
    if (this.profileForm.valid) {
      // getRawValue incluye los campos deshabilitados (name/email) pero el DTO los ignorará
      this.profileService.updateProfile(this.profileForm.getRawValue()).subscribe({
        next: () => {
          alert('✅ ¡Perfil actualizado correctamente!');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error("Error al guardar:", err);
          alert('Error al actualizar los datos.');
        }
      });
    }
  }
}