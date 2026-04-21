import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
// todavia no esta hecho
// import { AuthService } from '../../services/auth';

@Component({
  // llamada al backend de la funcion de login
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

//funcion para guardar el login, llamando al backend
export class LoginComponent {
  loginData = { email: '', password: '' };
  errorMessage = '';

  // esconde

  constructor(private authService: AuthService, private router: Router) {}

//funcion para en enviar el login desde el backend
  onLogin() {
    this.authService.login(this.loginData).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);

        this.authService.actualizarEstado();

        this.router.navigate(['/feed']);
      },
      error: (err) => {
        this.errorMessage = 'Correo o contraseña incorrectos';
      }
    });
  }
}
