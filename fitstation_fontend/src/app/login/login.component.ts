import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorLogin: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  entrar() {
    this.errorLogin = false;
    
    this.authService.login(this.email, this.password).subscribe({
      next: (respuesta) => {
        // Guardamos el token JWT para futuras peticiones
        this.authService.guardarSesion(respuesta.token, respuesta.userRole);
        console.log('¡Bienvenido a FitStation!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error de acceso:', err);
        this.errorLogin = true;
      }
    });
  }
}