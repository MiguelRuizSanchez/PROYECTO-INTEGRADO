import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../admin.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  activeTab: string = 'users';

  users: any[] = [];
  classes: any[] = [];
  sessions: any[] = [];
  requests: any[] = [];
  routines: any[] = [];
  conversations: any[] = [];

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef // <-- INYECTAMOS EL DETECTOR DE CAMBIOS
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Al recibir los datos, forzamos a Angular a repintar la pantalla inmediatamente
    this.adminService.getUsers().subscribe(res => { this.users = res; this.cdr.detectChanges(); });
    this.adminService.getClasses().subscribe(res => { this.classes = res; this.cdr.detectChanges(); });
    this.adminService.getSessions().subscribe(res => { this.sessions = res; this.cdr.detectChanges(); });
    this.adminService.getRequests().subscribe(res => { this.requests = res; this.cdr.detectChanges(); });
    this.adminService.getRoutines().subscribe(res => { this.routines = res; this.cdr.detectChanges(); });
    this.adminService.getConversations().subscribe(res => { this.conversations = res; this.cdr.detectChanges(); });
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  deleteUser(id: number) {
    if(confirm('¿Eliminar usuario y TODO su historial?')) {
      this.adminService.deleteUser(id).subscribe(() => this.loadData());
    }
  }

  deleteClass(id: number) {
    if(confirm('¿Eliminar clase?')) {
      this.adminService.deleteClass(id).subscribe(() => this.loadData());
    }
  }

  deleteSession(id: number) {
    if(confirm('¿Eliminar sesión?')) {
      this.adminService.deleteSession(id).subscribe(() => this.loadData());
    }
  }
}
