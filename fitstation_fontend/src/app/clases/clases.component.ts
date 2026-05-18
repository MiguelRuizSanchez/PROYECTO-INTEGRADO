import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassService } from '../class.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-clases',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './clases.component.html',
  styleUrl: './clases.component.css'
})
export class ClasesComponent implements OnInit {
  // Almacenará las actividades agrupadas (Zumba, Natación...)
  clasesAgrupadas: any[] = [];
  
  // Guarda la fecha exacta elegida para cada actividad
  fechasSeleccionadas: { [key: string]: string } = {};
  
  // Guarda el idClass del horario seleccionado en cada tarjeta
  horariosSeleccionados: { [key: string]: number } = {};

  constructor(
    private classService: ClassService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarCatalogo();
  }

  cargarCatalogo() {
    this.classService.getAvailableClasses().subscribe({
      next: (datos: any[]) => {
        const grupos: { [key: string]: any } = {};
        
        // 🚀 Algoritmo de Agrupación Avanzado
        datos.forEach(clase => {
          const nombre = clase.name || clase.Name;
          const diaSemana = clase.dayOfWeek || clase.DayOfWeek;

          if (!grupos[nombre]) {
            grupos[nombre] = {
              name: nombre,
              description: clase.description || clase.Description,
              horarios: []
            };
          }

          grupos[nombre].horarios.push({
            idClass: clase.idClass || clase.IdClass,
            dayOfWeek: diaSemana,
            classTime: clase.classTime || clase.ClassTime,
            trainerName: clase.trainerName || clase.TrainerName,
            // 🚀 MÁGICO: Genera las fechas reales de las próximas 2 semanas para este día
            fechasValidas: this.calcularFechasParaDiaSemana(diaSemana)
          });
        });

        this.clasesAgrupadas = Object.values(grupos);

        // Pre-seleccionar el primer horario y su primera fecha válida por defecto
        this.clasesAgrupadas.forEach(grupo => {
          if (grupo.horarios.length > 0) {
            const primerHorario = grupo.horarios[0];
            this.horariosSeleccionados[grupo.name] = primerHorario.idClass;
            if (primerHorario.fechasValidas.length > 0) {
              this.fechasSeleccionadas[grupo.name] = primerHorario.fechasValidas[0];
            }
          }
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al conectar con el catálogo de clases:', err);
        this.cdr.detectChanges();
      }
    });
  }

  // 🗓️ Devuelve un array con las fechas (YYYY-MM-DD) de los días que coinciden en las próximas 2 semanas
  calcularFechasParaDiaSemana(nombreDiaIngles: string): string[] {
    const fechas: string[] = [];
    const mapaDias: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const diaDestino = mapaDias[nombreDiaIngles];
    if (diaDestino === undefined) return fechas;

    const hoy = new Date();
    // Buscamos dentro de la ventana estricta de 14 días (2 semanas)
    for (let i = 0; i <= 14; i++) {
      const copiaFecha = new Date();
      copiaFecha.setDate(hoy.getDate() + i);
      
      if (copiaFecha.getDay() === diaDestino) {
        const yyyy = copiaFecha.getFullYear();
        const mm = String(copiaFecha.getMonth() + 1).padStart(2, '0');
        const dd = String(copiaFecha.getDate()).padStart(2, '0');
        fechas.push(`${yyyy}-${mm}-${dd}`);
      }
    }
    return fechas;
  }

  // 🚀 Obtiene las fechas válidas del turno que el usuario tiene seleccionado en el desplegable
  getFechasDisponibles(grupo: any): string[] {
    const idSeleccionado = this.horariosSeleccionados[grupo.name];
    const horario = grupo.horarios.find((h: any) => h.idClass === Number(idSeleccionado));
    return horario ? horario.fechasValidas : [];
  }

  // 🔄 Reinicia la fecha al primer día válido cuando el usuario cambia el turno de hora
  onHorarioChange(nombreGrupo: string, grupo: any) {
    const fechas = this.getFechasDisponibles(grupo);
    if (fechas.length > 0) {
      this.fechasSeleccionadas[nombreGrupo] = fechas[0];
    } else {
      this.fechasSeleccionadas[nombreGrupo] = '';
    }
  }

  // ❤️ Traduce y da un formato impecable a las fechas para el usuario
  formatearFechaEspanol(fechaStr: string): string {
    if (!fechaStr) return '';
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(fecha);
  }

  reservar(nombreActividad: string) {
    const idClass = this.horariosSeleccionados[nombreActividad];
    const fechaElegida = this.fechasSeleccionadas[nombreActividad];

    if (!idClass) {
      alert('⚠️ Por favor, selecciona un horario de la lista.');
      return;
    }

    if (!fechaElegida) {
      alert('⚠️ Por favor, selecciona una fecha válida para asistir.');
      return;
    }

    this.classService.bookClass(idClass, fechaElegida).subscribe({
      next: (res) => {
        alert(res.message || '✅ ¡Reserva confirmada!');
      },
      error: (err) => {
        alert('⚠️ No se pudo reservar: ' + (err.error || err.message));
      }
    });
  }
}