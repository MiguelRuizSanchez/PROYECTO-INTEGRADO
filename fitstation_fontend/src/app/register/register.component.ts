import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  // registerForm: Es el objeto que controla los datos y la validación del formulario de registro.
  registerForm: FormGroup;
  
  // feedbackMessage: Variable para mostrar al usuario si el registro ha dado algún error (ej. email ya registrado).
  feedbackMessage: string = '';

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private router: Router
  ) {
    // Definimos las reglas del formulario: nombre, email y contraseña son obligatorios.
    // El rol por defecto es 'client' (alumno).
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['client', [Validators.required]]
    });
  }

  // executeRegistration: Función que se ejecuta al darle al botón de crear cuenta.
  executeRegistration() {
    // Si el formulario no está bien relleno, no hacemos nada.
    if (this.registerForm.invalid) return;

    // Enviamos los datos al backend (C#) para crear el nuevo usuario en la base de datos.
    this.http.post('http://localhost:5038/api/Auth/register', this.registerForm.value).subscribe({
      next: () => {
        // Si todo sale bien, avisamos al usuario y lo mandamos al login.
        alert('¡Cuenta creada! Ahora puedes iniciar sesión.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        // Si hay error (ej. email duplicado), mostramos el mensaje al usuario.
        console.error("Error al registrar:", err);
        this.feedbackMessage = 'Error al registrar. El email podría estar en uso.';
      }
    });
  }
}