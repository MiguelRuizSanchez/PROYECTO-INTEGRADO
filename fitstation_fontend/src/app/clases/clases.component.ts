import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassService } from '../class.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-clases',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './clases.component.html',
  styleUrl: './clases.component.css'
})
export class ClasesComponent implements OnInit {
  listaClases: any[] = [];
  mensajeReserva: string = '';

  constructor(private classService: ClassService) {}

  ngOnInit() {
    this.cargarCatalogo();
  }

  // 🚀 Conexión directa: Descarga las clases colectivas de la base de datos
  cargarCatalogo() {
    this.classService.getAvailableClasses().subscribe({
      next: (datos) => {
        this.listaClases = datos;
      },
      error: (err) => {
        console.error('Error al conectar con el catálogo de clases:', err);
      }
    });
  }

  // 🎯 Acción de Reserva: Envía la solicitud protegida al servidor
  reservar(idClass: number) {
    this.classService.bookClass(idClass).subscribe({
      next: (res) => {
        alert(res.message || '✅ ¡Reserva confirmada!');
      },
      error: (err) => {
        alert('⚠️ No se pudo reservar: ' + (err.error || err.message));
      }
    });
  }
}