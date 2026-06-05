import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = 'http://localhost:5038/api/chat';
  private hubConnection: signalR.HubConnection | null = null;
  private messageReceived = new Subject<any>();
  messageReceived$ = this.messageReceived.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  startConnection() {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) return;
    const token = localStorage.getItem('token') || '';
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5038/hubs/chat', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveMessage', (msg: any) => {
      this.messageReceived.next(msg);
    });
    this.hubConnection.start().catch(err => console.error('SignalR error:', err));
  }

  joinConversation(idConversation: number) {
    if(idConversation > 0) this.hubConnection?.invoke('JoinConversation', idConversation);
  }

  leaveConversation(idConversation: number) {
    if(idConversation > 0) this.hubConnection?.invoke('LeaveConversation', idConversation);
  }

  sendMessageRealTime(idConversation: number, content: string, senderId: number) {
    if(idConversation > 0) {
      this.hubConnection?.invoke('SendMessage', idConversation, content, senderId);
    }
  }

  stopConnection() {
    this.hubConnection?.stop();
  }

  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/conversations`, { headers: this.getHeaders() });
  }

  getMessages(receiverId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/${receiverId}`, { headers: this.getHeaders() });
  }

  sendMessage(idConversation: number, content: string, receiverId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/send`, {
      IdConversation: idConversation,
      Content: content,
      ReceiverId: receiverId
    }, { headers: this.getHeaders() });
  }
}
