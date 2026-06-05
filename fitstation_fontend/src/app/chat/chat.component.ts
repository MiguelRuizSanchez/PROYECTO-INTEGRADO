import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ChatService } from '../chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: any[] = [];
  newMessage: string = '';
  contacts: any[] = [];
  selectedContact: any = null;
  myId: number = 0;
  private msgSub: Subscription | null = null;

  constructor(
    private chatService: ChatService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.myId = Number(localStorage.getItem('userId')) || 0;
  }

  ngOnInit() {
    this.chatService.startConnection();

    this.msgSub = this.chatService.messageReceived$.subscribe(msg => {
      const incomingConvId = Number(msg.idConversation || msg.IdConversation);
      const incomingSenderId = Number(msg.idSender || msg.IdSender);
      const currentMyId = Number(this.myId);

      if (this.selectedContact && incomingConvId === this.selectedContact.idConversation && incomingSenderId !== currentMyId) {
        this.messages.push({
          content: msg.content || msg.Content,
          idSender: incomingSenderId,
          createdAt: msg.createdAt || msg.CreatedAt || new Date()
        });
        this.cdr.detectChanges();
        this.scrollToBottom();
      }
    });

    this.loadContacts();
  }

  ngOnDestroy() {
    if (this.selectedContact?.idConversation > 0) {
      this.chatService.leaveConversation(this.selectedContact.idConversation);
    }
    this.msgSub?.unsubscribe();
    this.chatService.stopConnection();
  }

  loadContacts() {
    this.chatService.getConversations().subscribe({
      next: (convs: any[]) => {
        console.log("Datos recibidos del Backend:", convs);

        if (!convs || convs.length === 0) {
          this.contacts = [];
          this.cdr.detectChanges();
          return;
        }

        this.contacts = convs.map(c => ({
          idConversation: c.idConversation || c.IdConversation || 0,
          otherUserId: c.otherUserId || c.OtherUserId || 0,
          otherUserName: c.otherUserName || c.OtherUserName || 'Usuario'
        }));

        console.log("Contactos listos para mostrarse:", this.contacts);

        this.route.params.subscribe(params => {
          if (params['id']) {
            const targetId = Number(params['id']);
            const contact = this.contacts.find(c => c.otherUserId === targetId);
            if (contact) this.selectContact(contact);
          }
        });

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando contactos', err)
    });
  }

  selectContact(contact: any) {
    if (this.selectedContact?.idConversation > 0) {
      this.chatService.leaveConversation(this.selectedContact.idConversation);
    }

    this.selectedContact = contact;
    this.messages = [];
    this.cdr.detectChanges();

    this.loadHistory();
  }

  loadHistory() {
    if (!this.selectedContact) return;

    this.chatService.getMessages(this.selectedContact.otherUserId).subscribe({
      next: (msgs: any[]) => {
        this.messages = msgs.map(m => ({
          content: m.content || m.Content,
          idSender: m.idSender || m.IdSender,
          createdAt: m.createdAt || m.CreatedAt
        }));

        if (this.selectedContact.idConversation > 0) {
          this.chatService.joinConversation(this.selectedContact.idConversation);
        }

        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (err) => console.error('Error cargando historial', err)
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedContact) return;

    const texto = this.newMessage;
    this.newMessage = '';

    this.chatService.sendMessage(this.selectedContact.idConversation, texto, this.selectedContact.otherUserId).subscribe({
      next: (res: any) => {
        const newConvId = res.idConversation || res.IdConversation;

        if (this.selectedContact.idConversation === 0 && newConvId > 0) {
          this.selectedContact.idConversation = newConvId;
          this.chatService.joinConversation(newConvId);
        }

        this.messages.push({
          content: res.content || res.Content,
          idSender: res.idSender || res.IdSender,
          createdAt: res.createdAt || res.CreatedAt || new Date()
        });

        this.cdr.detectChanges();
        this.scrollToBottom();


        this.chatService.sendMessageRealTime(this.selectedContact.idConversation, texto, this.myId);
      },
      error: (err) => alert('No se pudo enviar el mensaje.')
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }
}
