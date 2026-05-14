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
    // Inicializamos el formulario con todos los controles necesarios
    this.questForm = this.fb.group({
      // Campos Worker
      Specialization: [''],
      Bio: [''],
      PricePerSession: [0],
      MaxCapacity: [0],

      // Campos Client
      Objectives: ['', Validators.required],
      ExperienceLevel: ['principiante', Validators.required],
      Modality: ['presencial', Validators.required],

      // Comunes
      PrefDay: ['Monday', Validators.required],
      PrefTime: ['10:00', Validators.required]
    });
  }

  ngOnInit() {
    this.rol = localStorage.getItem('role') || 'client';
  }

  enviar() {
    if (this.questForm.valid) {
      console.log('Enviando perfil:', this.questForm.value);
      this.profileService.updateProfile(this.questForm.value).subscribe({
        next: () => {
          alert('¡Perfil configurado con éxito!');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          alert('Error al guardar los datos.');
        }
      });
    } else {
      alert('Completa los campos obligatorios antes de continuar.');
    }
  }
}