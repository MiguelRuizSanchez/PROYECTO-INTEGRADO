import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // AJUSTE: Verifica si el puerto de .NET es 5000 o 5100
  private apiUrl = 'http://localhost:5000/api/auth'; 

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    // El Backend espera un objeto con "Email" y "Password"
    const datos = {
      Email: email,
      Password: password
    };
    return this.http.post(`${this.apiUrl}/login`, datos);
  }

  // Función para guardar el token de seguridad en el navegador
  guardarSesion(token: string, role: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
  }
}