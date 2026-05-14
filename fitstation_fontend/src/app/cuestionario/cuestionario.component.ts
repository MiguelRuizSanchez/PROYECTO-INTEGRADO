import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cuestionario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cuestionario.component.html',
  styleUrls: ['./cuestionario.component.css']
})
export class CuestionarioComponent implements OnInit {
  questForm: FormGroup;
  rol: string = 'client';

  constructor(
    private fb: FormBuilder, 
    private profileService: ProfileService, 
    private router: Router
  ) {
    // Inicializamos el formulario con las claves en Mayúscula para C#
    this.questForm = this.fb.group({
      // Campos para el Coach (Worker)
      Specialization: ['Musculacion'],
      Bio: [''],
      PricePerSession: [20],
      MaxCapacity: [10], // IMPORTANTE: Mayor que 0 para aparecer en el buscador

      // Campos para el Atleta (Client)
      Objectives: ['Musculacion', Validators.required],
      ExperienceLevel: ['principiante', Validators.required],
      Modality: ['presencial', Validators.required],

      // Campos Comunes
      PrefDay: ['Monday', Validators.required],
      PrefTime: ['10:00', Validators.required]
    });
  }

  ngOnInit() {
    this.rol = localStorage.getItem('userRole') || 'client';
  }

  enviar() {
    if (this.questForm.valid) {
      console.log('Enviando perfil:', this.questForm.value);
      // Enviamos el objeto con las claves corregidas al servicio
      this.profileService.updateProfile(this.questForm.value).subscribe({
        next: () => {
          alert('¡Perfil configurado con éxito! Bienvenido a FitStation.');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          alert('Hubo un error al guardar tu perfil. Inténtalo de nuevo.');
        }
      });
    } else {
      alert('Por favor, rellena todos los campos obligatorios.');
    }
  }
}