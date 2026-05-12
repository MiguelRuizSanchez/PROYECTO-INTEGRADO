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
  loginForm!: FormGroup;
  mensaje: string = '';

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  realizarLogin(): void {
    if (this.loginForm.invalid) return;

    this.http.post<any>('http://localhost:5038/api/Auth/login', this.loginForm.value).subscribe({
      next: (res) => {
        // Guardamos los datos que vienen del backend
        localStorage.setItem('token', res.token);
        localStorage.setItem('userId', (res.userId || res.UserId).toString());
        localStorage.setItem('userRole', (res.userRole || res.UserRole).toLowerCase());

        this.mensaje = '¡Bienvenido a FitStation!';
        setTimeout(() => this.router.navigate(['/dashboard']), 1000);
      },
      error: (err) => {
        console.error(err);
        this.mensaje = 'Correo o contraseña incorrectos.';
      }
    });
  }
}