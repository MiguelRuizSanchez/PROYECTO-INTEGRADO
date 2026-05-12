import { Component } from '@angular/core'; // <--- ESTA LÍNEA ES VITAL

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css' // O styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {}