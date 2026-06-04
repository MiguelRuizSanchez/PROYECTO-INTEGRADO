import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  userRole: string = '';
  isLoading: boolean = true;

  constructor(
    private fb: FormBuilder, 
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {
    this.profileForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      specialization: [''],
      bio: [''],
      pricePerSession: [0],
      maxCapacity: [10],
      objectives: [''],
      goal: [''],
      experienceLevel: [''],
      modality: [''],
      medicalNotes: [''],
      equipment: [''],
      prefDay: ['Monday'],
      prefTime: ['10:00']
    });
  }

  ngOnInit() {
    this.loadProfileData();
  }

  loadProfileData() {
    this.profileService.getMyProfile().subscribe({
      next: (res: any) => {
        this.userRole = (res?.role || res?.Role || '').toLowerCase().trim();
        const details = res?.details || res?.Details || {};

        let timeString = details?.pref_time || details?.prefTime || details?.PrefTime || '10:00';
        if (typeof timeString === 'string' && timeString.includes(':')) {
            timeString = timeString.substring(0, 5);
        }

        this.profileForm.patchValue({
          name: res?.name || res?.Name || '',
          email: res?.email || res?.Email || '',
          specialization: details?.specialization || details?.Specialization || details?.specialty || '',
          bio: details?.bio || details?.Bio || '',
          pricePerSession: details?.price_per_session || details?.pricePerSession || 0,
          maxCapacity: details?.max_capacity || details?.maxCapacity || 10,
          objectives: details?.objectives || details?.Objectives || '',
          goal: details?.goal || details?.Goal || '',
          experienceLevel: details?.experience_level || details?.experienceLevel || 'principiante',
          modality: details?.modality || details?.Modality || 'presencial',
          medicalNotes: details?.medical_notes || details?.medicalNotes || '',
          equipment: details?.equipment || details?.Equipment || '',
          prefDay: details?.pref_day || details?.prefDay || 'Monday',
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

  saveProfile() {
    if (this.profileForm.valid) {
      const formData = this.profileForm.getRawValue();

      if (this.userRole === 'worker' && (!formData.specialization || formData.specialization.trim() === '')) {
        alert('Por favor, indica tu especialidad.');
        return;
      }

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