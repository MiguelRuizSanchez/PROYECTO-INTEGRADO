import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  mensajeError: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  realizarLogin() {
    this.mensajeError = ''; // Limpiar errores previos

    this.authService.login(this.email, this.password).subscribe({
      next: (data) => {
        console.log('Login exitoso:', data);
        this.authService.guardarSesion(data.token, data.role);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error en la autenticación:', err);
        // Manejo de errores basado en códigos de estado HTTP
        if (err.status === 401 || err.status === 400) {
          this.mensajeError = 'Usuario o contraseña incorrectos.';
        } else if (err.status === 0) {
          this.mensajeError = 'No se pudo conectar con el servidor. ¿Está el backend encendido?';
        } else {
          this.mensajeError = 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
        }
      }
    });
  }
}