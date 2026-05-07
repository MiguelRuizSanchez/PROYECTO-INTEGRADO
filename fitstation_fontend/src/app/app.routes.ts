import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RegisterComponent } from './register/register.component'; // Importamos el nuevo componente

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }, // <-- Ruta para crear cuenta
  { path: 'dashboard', component: DashboardComponent },
  { path: '**', redirectTo: 'login' } // Si alguien escribe cualquier cosa, al login
];