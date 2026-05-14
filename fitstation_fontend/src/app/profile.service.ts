import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:5038/api'; // Mantenemos tu puerto original

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // --- 1. PERFIL ---
  getMyProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Profile/me`, { headers: this.getHeaders() });
  }

  updateProfile(dto: any): Observable<any> {
    const headers = this.getHeaders().set('Content-Type', 'application/json');
    return this.http.post(`${this.apiUrl}/Profile/update`, dto, { headers });
  }

  // --- 2. BUSCADOR Y MATCH ---
  getSuggestedWorkers(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Matching/suggested-workers/${clientId}`, { headers: this.getHeaders() });
  }

  sendMatchRequest(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Request/send`, payload, { headers: this.getHeaders() });
  }

  // --- 3. PETICIONES Y SESIONES ---
  getWorkerRequests(workerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Request/worker/${workerId}`, { headers: this.getHeaders() });
  }

  getClientRequests(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Request/client/${clientId}`, { headers: this.getHeaders() });
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

  finishSession(sessionId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/Session/finish/${sessionId}`, {}, { headers: this.getHeaders() });
  }

  getSessionDetails(sessionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Session/details/${sessionId}`, { headers: this.getHeaders() });
  }

  getOccupiedSlots(workerId: number, day: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/Session/occupied-slots/${workerId}/${day}`, { headers: this.getHeaders() });
  }

  // --- 4. CHAT ---
  getChatHistory(receiverId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Chat/history/${receiverId}`, { headers: this.getHeaders() });
  }

  sendMessage(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Chat/send`, payload, { headers: this.getHeaders() });
  }

  // --- 5. EJERCICIOS Y RUTINAS (Limpieza de duplicados) ---
  
  // Obtiene los ejercicios de tu tabla (Antes tenías dos versiones de esto)
  getExercises(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Exercise`, { headers: this.getHeaders() });
  }

  getWorkerRoutines(workerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Routine/worker/${workerId}`, { headers: this.getHeaders() });
  }

  // Función para crear la cabecera de la rutina
  createRoutine(routinePayload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Routine`, routinePayload, { headers: this.getHeaders() });
  }

  // Para el guardado completo que estamos montando
  createFullRoutine(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Routine/create-full`, payload, { headers: this.getHeaders() });
  }

  addExerciseToRoutine(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Routine/add-exercise`, payload, { headers: this.getHeaders() });
  }

  assignRoutineToClient(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Routine/assign-to-client`, payload, { headers: this.getHeaders() });
  }

  getClientRoutines(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Routine/client/${clientId}`, { headers: this.getHeaders() });
  }

  getRoutineDetails(routineId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Routine/${routineId}/details`, { headers: this.getHeaders() });
  }
}