import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    HttpClientModule, 
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  // loginForm: Es el objeto que controla los datos y la validación del formulario de login.
  loginForm!: FormGroup;
  
  // feedbackMessage: Variable para mostrar al usuario si el login ha ido bien o mal (ej. error de contraseña).
  feedbackMessage: string = '';

  // Inyectamos las herramientas necesarias: FormBuilder para el formulario, HttpClient para hablar con el backend, y Router para movernos por las páginas.
  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private router: Router
  ) {}

  // Al cargar el componente, preparamos el formulario con sus reglas (campos obligatorios y formato de email).
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  // executeLogin: Es la función que se ejecuta al darle al botón de entrar.
  executeLogin(): void {
    // Si el formulario no está bien relleno (falta algún campo), no hacemos nada.
    if (this.loginForm.invalid) return;

    // Enviamos el correo y la contraseña al servidor (backend en C#).
    this.http.post<any>('http://localhost:5038/api/Auth/login', this.loginForm.value).subscribe({
      next: (res) => {
        // Si el login es correcto, guardamos el token y los datos del usuario en la memoria del navegador.
        localStorage.setItem('token', res.token);
        localStorage.setItem('userId', (res.userId || res.UserId).toString());
        localStorage.setItem('userRole', (res.userRole || res.UserRole).toLowerCase());

        this.feedbackMessage = '¡Bienvenido a FitStation!';
        
        // Esperamos un segundo para mostrar el mensaje de bienvenida y redirigimos al dashboard.
        setTimeout(() => this.router.navigate(['/dashboard']), 1000);
      },
      error: (err) => {
        // Si las credenciales fallan, mostramos un aviso al usuario.
        console.error("Authentication error:", err);
        this.feedbackMessage = 'Correo o contraseña incorrectos.';
      }
    });
  }
}