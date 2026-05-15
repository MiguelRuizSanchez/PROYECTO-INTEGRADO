import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SessionDetailComponent } from './session-detail/session-detail.component';
import { PerfilComponent } from './perfil/perfil.component';
import { CalendarioComponent } from './calendario/calendario.component';
import { EntrenamientoComponent } from './entrenamiento/entrenamiento.component';
import { GestionRutinasComponent } from './gestion-rutinas/gestion-rutinas.component';
import { CrearRutinaComponent } from './crear-rutina/crear-rutina.component';
import { BuscadorComponent } from './buscador/buscador.component';
// 🚀 NUEVA IMPORTACIÓN: Con esto solucionamos el error 'Cannot find name'
import { ClasesComponent } from './clases/clases.component';

export const routes: Routes = [
  // 🚀 Coma añadida al final de la línea para solucionar el error de sintaxis
  { path: 'clases', component: ClasesComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'session/:id', component: SessionDetailComponent },
  { path: 'perfil', component: PerfilComponent },
  { path: 'calendario', component: CalendarioComponent },
  { path: 'entrenamiento/:id', component: EntrenamientoComponent },
  { path: 'gestion-rutinas/:id', component: GestionRutinasComponent },
  { path: 'crear-rutina', component: CrearRutinaComponent },
  { path: 'buscador', component: BuscadorComponent },
  
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];