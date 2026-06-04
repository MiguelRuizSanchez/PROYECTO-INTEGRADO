import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  private apiUrl = 'http://localhost:5038/api/Class';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAvailableClasses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/available`);
  }

  bookClass(idClass: number, chosenDate: string): Observable<any> {
    const payload = { 
      idClass: Number(idClass),
      chosenDate: chosenDate
    };
    return this.http.post<any>(`${this.apiUrl}/book`, payload, { headers: this.getHeaders() });
  }

  getClientClassCalendar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/client-calendar`, { headers: this.getHeaders() });
  }

  getWorkerClassCalendar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/worker-calendar`, { headers: this.getHeaders() });
  }

  cancelBooking(idBooking: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/cancel/${idBooking}`, { headers: this.getHeaders() });
  }
}