import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CuestionarioComponent } from './cuestionario/cuestionario.component';
import { BuscadorComponent } from './buscador/buscador.component';
import { SessionDetailComponent } from './session-detail/session-detail.component';
import { PerfilComponent } from './perfil/perfil.component'; 
import { CrearRutinaComponent } from './crear-rutina/crear-rutina.component'; // 👈 NUEVO

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'cuestionario', component: CuestionarioComponent },
  { path: 'buscador', component: BuscadorComponent },
  { path: 'session/:id', component: SessionDetailComponent },
  { path: 'perfil', component: PerfilComponent },
  { path: 'crear-rutina', component: CrearRutinaComponent }, // 👈 NUEVO
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];