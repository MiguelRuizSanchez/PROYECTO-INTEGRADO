import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  nombre: string = '';
  email: string = '';
  clave: string = '';
  rol: string = 'client'; // Por defecto atleta
  mensajeError: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  realizarRegistro() {
    this.mensajeError = '';
    
    // Llamamos al servicio que conecta con el controlador de .NET
    this.authService.registrar(this.nombre, this.email, this.clave, this.rol).subscribe({
      next: (resp) => {
        console.log('Registro exitoso en MariaDB:', resp);
        alert('¡Cuenta creada correctamente!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al registrar:', err);
        this.mensajeError = 'Error al crear la cuenta. Puede que el email ya exista.';
      }
    });
  }
}