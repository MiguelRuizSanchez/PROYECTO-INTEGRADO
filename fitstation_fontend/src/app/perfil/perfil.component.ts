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
    // 🚀 Inicializamos el formulario usando estrictamente las minúsculas/camelCase
    // que coinciden al 100% con los formControlName de tu archivo HTML
    this.profileForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      
      // Campos para el Entrenador (Worker)
      specialization: [''],
      bio: [''],
      pricePerSession: [0],
      maxCapacity: [10],

      // Campos para el Atleta (Client)
      objectives: [''],
      experienceLevel: [''],
      modality: [''],
      
      // Disponibilidad
      prefDay: ['Monday'],
      prefTime: ['10:00']
    });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        this.rol = (res?.role || res?.Role || '').toLowerCase().trim();
        const d = res?.details || res?.Details || {};
        
        // Formateamos la hora si contiene segundos para dejarla limpia
        let hora = d?.prefTime || d?.PrefTime || '10:00';
        if (typeof hora === 'string' && hora.includes(':')) {
            hora = hora.substring(0, 5);
        }

        // Mapeamos los datos recibidos del servidor a nuestras claves en minúscula
        this.profileForm.patchValue({
          name: res?.name || res?.Name || '',
          email: res?.email || res?.Email || '',
          specialization: d?.specialization || d?.Specialization || d?.specialty || d?.Specialty || '',
          bio: d?.bio || d?.Bio || '',
          pricePerSession: d?.pricePerSession || d?.PricePerSession || 0,
          maxCapacity: d?.maxCapacity || d?.MaxCapacity || 10,
          objectives: d?.objectives || d?.Objectives || '',
          experienceLevel: d?.experienceLevel || d?.ExperienceLevel || 'principiante',
          modality: d?.modality || d?.Modality || 'presencial',
          prefDay: d?.prefDay || d?.PrefDay || 'Monday',
          prefTime: hora
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
      const formData = this.profileForm.getRawValue();

      // Validación defensiva manual solo si el rol actual es un entrenador
      if (this.rol === 'worker' && (!formData.specialization || formData.specialization.trim() === '')) {
        alert('⚠️ Por favor, selecciona una Especialidad Principal antes de continuar.');
        return;
      }

      // Enviamos el objeto con las propiedades en minúscula hacia el backend blindado
      this.profileService.updateProfile(formData).subscribe({
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