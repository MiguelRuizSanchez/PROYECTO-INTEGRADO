import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:5038/api/chat';

  constructor(private http: HttpClient) { }

  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/conversations`);
  }

  getMessages(idConversation: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/messages/${idConversation}`);
  }


sendMessage(idConversation: number, content: string, receiverId: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/send`, { 
    IdConversation: idConversation, 
    Content: content, 
    ReceiverId: receiverId 
  });
}
}