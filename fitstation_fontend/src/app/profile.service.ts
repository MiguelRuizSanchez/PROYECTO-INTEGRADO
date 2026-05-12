import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:5038/api';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // --- PERFIL ---
  getMyProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Profile/me`, { headers: this.getHeaders() });
  }

  updateProfile(dto: any): Observable<any> {
    // Usamos el Content-Type para asegurar que el JSON se envíe bien
    const headers = this.getHeaders().set('Content-Type', 'application/json');
    return this.http.post(`${this.apiUrl}/Profile/update`, dto, { headers });
  }

  // --- BUSCADOR Y MATCH ---
  getSuggestedWorkers(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Matching/suggested-workers/${clientId}`, { headers: this.getHeaders() });
  }

  sendMatchRequest(workerId: number): Observable<any> {
    const params = new HttpParams().set('workerId', workerId.toString());
    return this.http.post(`${this.apiUrl}/Request/send`, {}, { headers: this.getHeaders(), params });
  }

  // --- PETICIONES Y SESIONES ---
  getWorkerRequests(workerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Request/worker/${workerId}`, { headers: this.getHeaders() });
  }

  updateStatus(requestId: number, status: string): Observable<any> {
    const headers = this.getHeaders().set('Content-Type', 'application/json');
    return this.http.put(`${this.apiUrl}/Request/update-status/${requestId}`, JSON.stringify(status), { headers });
  }

  getClientSessions(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Session/client/${clientId}`, { headers: this.getHeaders() });
  }

  getWorkerSessions(workerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Session/worker/${workerId}`, { headers: this.getHeaders() });
  }

  // --- CHAT Y DETALLES ---
  getSessionDetails(sessionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Session/details/${sessionId}`, { headers: this.getHeaders() });
  }

  getChatHistory(receiverId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Chat/history/${receiverId}`, { headers: this.getHeaders() });
  }

  sendMessage(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Chat/send`, payload, { headers: this.getHeaders() });
  }
}