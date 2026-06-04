import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5038/api/auth'; 

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    const datos = {
      Email: email,
      Password: password
    };
    return this.http.post(`${this.apiUrl}/login`, datos);
  }

  registrar(nombre: string, email: string, clave: string, rol: string): Observable<any> {
    const datos = {
      Name: nombre,
      Email: email,
      Password: clave,
      Role: rol 
    };
    return this.http.post(`${this.apiUrl}/register`, datos);
  }

  guardarSesion(token: string, role: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
  }
}