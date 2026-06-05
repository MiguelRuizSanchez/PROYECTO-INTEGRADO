import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'http://localhost:5038/api/admin';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token') || '';
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }

  getUsers(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/users`, this.getHeaders()); }
  deleteUser(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/users/${id}`, this.getHeaders()); }

  getClasses(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/classes`, this.getHeaders()); }
  deleteClass(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/classes/${id}`, this.getHeaders()); }

  getSessions(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/sessions`, this.getHeaders()); }
  deleteSession(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/sessions/${id}`, this.getHeaders()); }

  getRequests(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/requests`, this.getHeaders()); }
  getRoutines(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/routines`, this.getHeaders()); }
  getConversations(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/conversations`, this.getHeaders()); }
}
