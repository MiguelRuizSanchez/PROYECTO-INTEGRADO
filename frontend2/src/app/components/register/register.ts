import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  registerData = { firstName: '', lastName1: 'Apellido', nickname: '', email: '', password: '' };

  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    this.authService.register(this.registerData).subscribe({
      next: (res: any) => {
        console.log('Registro OK', res);
        this.successMessage = 'Usuario registrado con éxito. Ya puedes iniciar sesión.';
        this.errorMessage = '';

      },
      error: (err: any) => {
        console.error('Error en registro', err);
        this.errorMessage = err.error?.message || 'Ocurrió un error al registrar el usuario.';
        this.successMessage = '';
      }
    });
  }
}
