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
  // profileForm: Es el molde del formulario que Angular usa para manejar los datos del usuario.
  profileForm: FormGroup;
  
  // userRole: Define si el usuario es alumno ('client') o entrenador ('worker').
  userRole: string = '';
  
  // isLoading: Indica si la aplicación está esperando la respuesta del servidor.
  isLoading: boolean = true;

  constructor(
    private fb: FormBuilder, 
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {
    // Inicializamos el formulario con campos vacíos. 
    // Algunos campos están desactivados (disabled) porque no queremos que el usuario cambie su email o nombre.
    this.profileForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      
      // Campos específicos para Entrenadores (Worker)
      specialization: [''],
      bio: [''],
      pricePerSession: [0],
      maxCapacity: [10],

      // Campos específicos para Alumnos (Client)
      objectives: [''],
      experienceLevel: [''],
      modality: [''],
      
      // Preferencias generales
      prefDay: ['Monday'],
      prefTime: ['10:00']
    });
  }

  // Al cargar el componente, solicitamos los datos del perfil actual.
  ngOnInit() {
    this.loadProfileData();
  }

  // Función para obtener los datos desde el servicio y rellenar el formulario.
  loadProfileData() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        // Obtenemos el rol y los detalles, normalizando los nombres para evitar problemas de mayúsculas.
        this.userRole = (res?.role || res?.Role || '').toLowerCase().trim();
        const details = res?.details || res?.Details || {};
        
        // Ajustamos el formato de la hora para el input time.
        let timeString = details?.prefTime || details?.PrefTime || '10:00';
        if (typeof timeString === 'string' && timeString.includes(':')) {
            timeString = timeString.substring(0, 5);
        }

        // Cargamos los datos recibidos en el formulario.
        this.profileForm.patchValue({
          name: res?.name || res?.Name || '',
          email: res?.email || res?.Email || '',
          specialization: details?.specialization || details?.Specialization || details?.specialty || details?.Specialty || '',
          bio: details?.bio || details?.Bio || '',
          pricePerSession: details?.pricePerSession || details?.PricePerSession || 0,
          maxCapacity: details?.maxCapacity || details?.MaxCapacity || 10,
          objectives: details?.objectives || details?.Objectives || '',
          experienceLevel: details?.experienceLevel || details?.ExperienceLevel || 'principiante',
          modality: details?.modality || details?.Modality || 'presencial',
          prefDay: details?.prefDay || details?.PrefDay || 'Monday',
          prefTime: timeString
        });
        
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Error al cargar perfil:", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Función para guardar los cambios realizados en el formulario.
  saveProfile() {
    if (this.profileForm.valid) {
      // Obtenemos todos los valores, incluyendo los campos deshabilitados (nombre/email).
      const formData = this.profileForm.getRawValue();

      // Validación simple para asegurar que el entrenador defina su especialidad.
      if (this.userRole === 'worker' && (!formData.specialization || formData.specialization.trim() === '')) {
        alert('Por favor, indica tu especialidad.');
        return;
      }

      // Enviamos los datos al backend para actualizar la base de datos.
      this.profileService.updateProfile(formData).subscribe({
        next: () => {
          alert('¡Perfil guardado con éxito!');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error("Error al guardar:", err);
          alert('Ocurrió un error al guardar los cambios.');
        }
      });
    }
  }
}