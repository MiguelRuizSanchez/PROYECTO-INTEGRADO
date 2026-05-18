import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  // Base URL apuntando a tu controlador de C#
  private apiUrl = 'http://localhost:5038/api/Class';

  constructor(private http: HttpClient) {}

  // 🔐 Generador de Cabeceras: Adjunta el token JWT para operar de forma segura
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // 📋 1. Catálogo global de actividades grupales (Zumba, Natación...)
  getAvailableClasses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/available`);
  }

  // 🎯 2. Reserva de clase colectiva pasando ID y fecha exacta
  bookClass(idClass: number, chosenDate: string): Observable<any> {
    const payload = { 
      idClass: Number(idClass),
      chosenDate: chosenDate
    };
    return this.http.post<any>(`${this.apiUrl}/book`, payload, { headers: this.getHeaders() });
  }

  // 📅 3. Obtener el listado de clases reservadas por el Cliente
  getClientClassCalendar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/client-calendar`, { headers: this.getHeaders() });
  }

  // 👔 4. Obtener el calendario de turnos laborales del Entrenador
  getWorkerClassCalendar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/worker-calendar`, { headers: this.getHeaders() });
  }

  // ❌ 5. NUEVO MÉTODO: Envía la orden de eliminación del registro a la base de datos
  cancelBooking(idBooking: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/cancel/${idBooking}`, { headers: this.getHeaders() });
  }
}