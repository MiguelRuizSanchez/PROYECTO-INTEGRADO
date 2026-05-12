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

  constructor(private fb: FormBuilder, private profileService: ProfileService, private router: Router) {
    this.questForm = this.fb.group({
      goal: ['', Validators.required],
      objectives: ['', Validators.required],
      experienceLevel: ['', Validators.required],
      modality: ['', Validators.required],
      prefDay: ['Monday'],
      prefTime: ['10:00:00']
    });
  }

  ngOnInit() {
    this.rol = localStorage.getItem('role') || 'client';
  }

  enviar() {
    if (this.questForm.valid) {
      this.profileService.updateProfile(this.questForm.value).subscribe({
        next: () => {
          alert('¡Perfil actualizado!');
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => console.error(err)
      });
    }
  }
}