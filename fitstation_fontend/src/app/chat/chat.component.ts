import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ChatService } from '../chat.service';
import { ProfileService } from '../profile.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  messages: any[] = [];
  newMessage: string = '';
  contacts: any[] = [];
  selectedContact: any = null;
  myId: number = 0;

  constructor(
    private chatService: ChatService,
    private profileService: ProfileService,
    private route: ActivatedRoute
  ) {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    this.myId = userData.id || userData.Id || 0;
  }

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    this.chatService.getConversations().subscribe({
      next: (convs) => {
        this.contacts = convs.map(c => ({
          idConversation: c.idConversation || c.IdConversation,
          idOtherUser: c.otherUserId || c.OtherUserId,
          name: c.otherUserName || c.OtherUserName || 'Usuario'
        }));

        this.route.params.subscribe(params => {
          if (params['id']) {
            this.selectContactByUserId(+params['id']);
          }
        });
      },
      error: (err) => console.error('Error cargando conversaciones', err)
    });
  }

  selectContact(contact: any) {
    this.selectedContact = contact;
    this.loadHistory();
  }

  selectContactByUserId(userId: number) {
    const existingContact = this.contacts.find(c => c.idOtherUser === userId);
    if (existingContact) {
      this.selectedContact = existingContact;
      this.loadHistory();
    } else {
      this.selectedContact = { 
        idConversation: 0, 
        idOtherUser: userId, 
        name: 'Nuevo Mensaje' 
      };
      this.messages = [];
    }
  }

  loadHistory() {
    const idConv = this.selectedContact?.idConversation;
    if (!idConv || idConv === 0) return;

    this.chatService.getMessages(idConv).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.scrollToBottom();
      },
      error: (err) => console.error('Error cargando mensajes', err)
    });
  }


sendMessage() {
  if (!this.newMessage.trim() || !this.selectedContact) return;

  const idConv = this.selectedContact.idConversation || 0;
  const targetId = this.selectedContact.idOtherUser || 0;

  this.chatService.sendMessage(idConv, this.newMessage, targetId).subscribe({
    next: (res: any) => {
      // Intentamos leer el ID de la conversación tanto en minúsculas como en mayúsculas
      const newId = res.idConversation || res.IdConversation;
      
      if (idConv === 0 && newId) {
        this.selectedContact.idConversation = newId;
      }

      this.messages.push({
        IdSender: this.myId,
        Content: this.newMessage,
        CreatedAt: new Date()
      });
      
      this.newMessage = '';
      this.scrollToBottom();
      
      if (idConv === 0) {
        this.loadContacts(); // Recarga para que aparezca en la lista
      }
    },
    error: (err) => {
      console.error('Error al enviar:', err);
      alert('No se pudo enviar el mensaje. Revisa la consola (F12).');
    }
  });
}

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }
}