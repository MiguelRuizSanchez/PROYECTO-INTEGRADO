import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SessionDetailComponent } from './session-detail/session-detail.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ClassesComponent } from './classes/classes.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { ProfileComponent } from './profile/profile.component';
import { CalendarComponent } from './calendar/calendar.component';
import { TrainingComponent } from './training/training.component';
import { RoutineManagementComponent } from './routine-management/routine-management.component';
import { CreateRoutineComponent } from './create-routine/create-routine.component';
import { SearchComponent } from './search/search.component';


import { ChatComponent } from './chat/chat.component';

export const routes: Routes = [
  { path: 'admin', component: AdminPanelComponent },
  { path: 'classes', component: ClassesComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'session/:id', component: SessionDetailComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'training/:id', component: TrainingComponent },
  { path: 'routine-management/:id', component: RoutineManagementComponent },
  { path: 'create-routine', component: CreateRoutineComponent },
  { path: 'search', component: SearchComponent },
  { path: 'questionnaire', component: QuestionnaireComponent },

  { path: 'chat', component: ChatComponent },
  { path: 'chat/:id', component: ChatComponent },

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
