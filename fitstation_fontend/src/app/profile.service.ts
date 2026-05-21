import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  // 🌐 URLs de conexión hacia tus controladores del Backend de C#
  private profileUrl = 'http://localhost:5038/api/Profile';
  private sessionUrl = 'http://localhost:5038/api/Session';
  private exerciseUrl = 'http://localhost:5038/api/Exercise';
  private routineUrl = 'http://localhost:5038/api/Routine';
  private chatUrl = 'http://localhost:5038/api/Chat';

  constructor(private http: HttpClient) {}

  // 🔐 Generador de Cabeceras Seguro: Adjunta el token JWT del usuario logueado
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==========================================
  // 👤 SECCIÓN A: CONTROL DE PERFIL Y ROLES
  // ==========================================

  getMyProfile(): Observable<any> {
    return this.http.get<any>(`${this.profileUrl}/my-profile`, { headers: this.getHeaders() });
  }

  updateProfile(payload: any): Observable<any> {
    return this.http.put<any>(`${this.profileUrl}/update`, payload, { headers: this.getHeaders() });
  }

  // ==========================================
  // 📩 SECCIÓN B: SOLICITUDES DE COACH PRIVADO
  // ==========================================

  // 🚀 Actualizado: Ahora transmite la fecha exacta y la hora de reserva elegida por el atleta
  requestCoach(idWorker: number, requestedDate: string, requestedTime: string): Observable<any> {
    // Obtenemos el día de la semana en inglés para que encaje con tu Base de Datos
    const dateObj = new Date(requestedDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dateObj.getDay()];

    const payload = {
      WorkerId: Number(idWorker),
      RequestedDay: dayName,
      RequestedTime: requestedTime + ":00" // Añadimos segundos para el TimeSpan de C#
    };

    // Llamamos al RequestController, que es el que gestiona esto correctamente
    return this.http.post<any>(`http://localhost:5038/api/Request/send`, payload, { headers: this.getHeaders() });
  }

  getWorkerRequests(idWorker: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.profileUrl}/worker-requests/${idWorker}`, { headers: this.getHeaders() });
  }

  getClientRequests(idClient: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.profileUrl}/client-requests/${idClient}`, { headers: this.getHeaders() });
  }

  updateStatus(requestId: number, status: string): Observable<any> {
    // 🚀 CORRECCIÓN: Apuntamos al RequestController que es el que fabrica la Session.
    // Además, enviamos el status entre comillas dobles `"${status}"` para que C#
    // lo reciba como un string JSON válido.
    return this.http.put<any>(
      `http://localhost:5038/api/Request/update-status/${requestId}`,
      `"${status}"`,
      { headers: this.getHeaders() }
    );
  }
  getSuggestedWorkers(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.profileUrl}/suggested-workers/${clientId}`, { headers: this.getHeaders() });
  }

  getOccupiedSlots(workerId: number, date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.profileUrl}/occupied-slots/${workerId}?date=${date}`, { headers: this.getHeaders() });
  }

  sendMatchRequest(payload: any): Observable<any> {
    return this.http.post<any>(`${this.profileUrl}/match-request`, payload, { headers: this.getHeaders() });
  }

  // ==========================================
  // 📅 SECCIÓN C: GESTIÓN DE SESIONES ACTIVAS
  // ==========================================

  getWorkerSessions(idWorker: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.sessionUrl}/worker/${idWorker}`, { headers: this.getHeaders() });
  }

  getClientSessions(idClient: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.sessionUrl}/client/${idClient}`, { headers: this.getHeaders() });
  }

  getSessionDetails(idSession: number): Observable<any> {
    return this.http.get<any>(`${this.sessionUrl}/details/${idSession}`, { headers: this.getHeaders() });
  }

  finishSession(idSession: number): Observable<any> {
    return this.http.put<any>(`${this.sessionUrl}/finish/${idSession}`, {}, { headers: this.getHeaders() });
  }

  // ==========================================
  // 🏋️ SECCIÓN D: BIBLIOTECA DE EJERCICIOS Y RUTINAS
  // ==========================================

  getExercises(): Observable<any[]> {
    return this.http.get<any[]>(`${this.exerciseUrl}`, { headers: this.getHeaders() });
  }

  createFullRoutine(payload: any): Observable<any> {
    return this.http.post<any>(`${this.routineUrl}/create-full`, payload, { headers: this.getHeaders() });
  }

  getClientRoutines(idClient: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.routineUrl}/client/${idClient}`, { headers: this.getHeaders() });
  }

  getWorkerRoutines(idWorker: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.routineUrl}/worker/${idWorker}`, { headers: this.getHeaders() });
  }

  getRoutineDetails(idRoutine: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.routineUrl}/details/${idRoutine}`, { headers: this.getHeaders() });
  }

  assignRoutineToClient(payload: any): Observable<any> {
    return this.http.post<any>(`${this.routineUrl}/assign`, payload, { headers: this.getHeaders() });
  }

  // ==========================================
  // 💬 SECCIÓN E: SISTEMA DE CHAT PRIVADO
  // ==========================================

  getChatHistory(receiverId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.chatUrl}/history/${receiverId}`, { headers: this.getHeaders() });
  }

  sendMessage(payload: any): Observable<any> {
    return this.http.post<any>(`${this.chatUrl}/send`, payload, { headers: this.getHeaders() });
  }
}
