import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { FeedComponent } from './components/feed/feed';
//import { ProfileComponent } from './components/profile/profile';
//import { AboutComponent } from './components/about/about';
//import { NetworkComponent } from './components/network/network';
//import { PublicProfileComponent } from './components/public-profile/public-profile';
//import { AdminComponent } from './components/admin/admin'; // Añade el import arriba

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'feed', component: FeedComponent },
  //{ path: 'network', component: NetworkComponent },
  //{ path: 'about', component: AboutComponent },


  //perfiles ajenos
  //{ path: 'profile/:id', component: PublicProfileComponent },

  //perfil propio
  //{ path: 'profile', component: ProfileComponent },
  //{ path: 'admin', component: AdminComponent },
  { path: '', redirectTo: '/feed', pathMatch: 'full' },
  { path: '**', redirectTo: '/feed' },
];
