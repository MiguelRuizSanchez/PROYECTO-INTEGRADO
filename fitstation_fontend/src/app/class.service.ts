import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  // Base URL apuntando directamente a tu nuevo controlador de C#
  private apiUrl = 'http://localhost:5038/api/Class';

  constructor(private http: HttpClient) {}

  // 🔐 Generador de Cabeceras: Adjunta el token del usuario para las zonas privadas
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // 📋 1. Traer catálogo de clases (Zumba, Natación...)
  getAvailableClasses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/available`);
  }

  // 🎯 2. Reservar una plaza en una clase colectiva
  bookClass(idClass: number): Observable<any> {
    const payload = { idClass: Number(idClass) };
    return this.http.post<any>(`${this.apiUrl}/book`, payload, { headers: this.getHeaders() });
  }

  // 📅 3. Obtener el calendario de clases reservadas por el Cliente
  getClientClassCalendar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/client-calendar`, { headers: this.getHeaders() });
  }

  // 👔 4. Obtener el calendario de turnos de trabajo del Entrenador
  getWorkerClassCalendar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/worker-calendar`, { headers: this.getHeaders() });
  }
}