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
    private cdr: ChangeDetectorRef // 👈 AÑADIDO: Fuerza a Angular a actualizar la vista
  ) {
    this.profileForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      specialization: [''],
      bio: [''],
      pricePerSession: [0],
      maxCapacity: [10],
      objectives: [''],
      experienceLevel: [''],
      modality: [''],
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
        this.rol = (res?.role || res?.Role || localStorage.getItem('userRole') || '').toLowerCase().trim();
        const d = res?.details || res?.Details || {};

        // 👈 AÑADIDO: Formatea la hora para evitar que el input "time" crashee el formulario
        let hora = d?.prefTime || d?.PrefTime || '10:00';
        if (hora.length > 5) hora = hora.substring(0, 5);

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
        this.cdr.detectChanges(); // 👈 AÑADIDO: Quita la pantalla de carga instantáneamente
      },
      error: (err) => {
        console.error("Error:", err);
        this.cargando = false;
        this.cdr.detectChanges();
        alert("Fallo al contactar con el servidor. Revisa si tu backend (C#) está encendido.");
      }
    });
  }

  guardar() {
    if (this.profileForm.valid) {
      this.profileService.updateProfile(this.profileForm.getRawValue()).subscribe({
        next: () => {
          alert('✅ Perfil actualizado correctamente. Tus cambios ya se reflejan en el buscador.');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => alert('Error al actualizar: ' + err.message)
      });
    }
  }
}