import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassService } from '../class.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-clases',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css'
})
export class ClassesComponent implements OnInit {
  // Agrupa las clases por su nombre (ej. junta todos los horarios de "Zumba" en un solo bloque).
  groupedClasses: any[] = [];

  // Guarda la fecha exacta que el alumno elige para asistir a la clase.
  selectedDates: { [key: string]: string } = {};

  // Guarda qué hora concreta de la clase ha elegido el alumno.
  selectedSchedules: { [key: string]: number } = {};

  constructor(
    private classService: ClassService,
    private cdr: ChangeDetectorRef
  ) {}

  // Lo primero que hace al cargar la página: pedir las clases disponibles.
  ngOnInit() {
    this.loadCatalog();
  }

  // Descarga las clases de la base de datos y las organiza para que no salgan repetidas.
  loadCatalog() {
    this.classService.getAvailableClasses().subscribe({
      next: (data: any[]) => {
        const groups: { [key: string]: any } = {};

        // Revisamos cada clase que nos llega del servidor
        data.forEach(classItem => {
          const name = classItem.name || classItem.Name;
          const dayOfWeek = classItem.dayOfWeek || classItem.DayOfWeek;

          // Si es la primera vez que vemos esta clase (ej. "Zumba"), le creamos su propio grupo
          if (!groups[name]) {
            groups[name] = {
              name: name,
              description: classItem.description || classItem.Description,
              schedules: []
            };
          }

          // Añadimos el horario a su grupo y calculamos en qué fechas reales cae.
          groups[name].schedules.push({
            idClass: classItem.idClass || classItem.IdClass,
            dayOfWeek: dayOfWeek,
            classTime: classItem.classTime || classItem.ClassTime,
            trainerName: classItem.trainerName || classItem.TrainerName,
            validDates: this.calculateDatesForWeekday(dayOfWeek)
          });
        });

        // Convertimos los grupos a una lista normal para poder pintarla en el HTML
        this.groupedClasses = Object.values(groups);

        // Seleccionamos la primera hora y la primera fecha por defecto para que no salga en blanco
        this.groupedClasses.forEach(group => {
          if (group.schedules.length > 0) {
            const firstSchedule = group.schedules[0];
            this.selectedSchedules[group.name] = firstSchedule.idClass;
            if (firstSchedule.validDates.length > 0) {
              this.selectedDates[group.name] = firstSchedule.validDates[0];
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

  // Truco del calendario: si le pasas "Monday", te devuelve las fechas exactas de los próximos dos lunes.
  calculateDatesForWeekday(englishDayName: string): string[] {
    const validDates: string[] = [];
    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const targetDay = dayMap[englishDayName];
    if (targetDay === undefined) return validDates;

    const today = new Date();

    // Miramos día por día desde hoy hasta dentro de 14 días
    for (let i = 0; i <= 14; i++) {
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + i);

      // Si el día de la semana coincide con el que buscamos, lo guardamos
      if (futureDate.getDay() === targetDay) {
        const yyyy = futureDate.getFullYear();
        const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
        const dd = String(futureDate.getDate()).padStart(2, '0');
        validDates.push(`${yyyy}-${mm}-${dd}`);
      }
    }
    return validDates;
  }

  // Busca qué fechas están disponibles según el turno de hora que haya elegido el usuario.
  getAvailableDates(group: any): string[] {
    const selectedId = this.selectedSchedules[group.name];
    const schedule = group.schedules.find((h: any) => h.idClass === Number(selectedId));
    return schedule ? schedule.validDates : [];
  }

  // Cuando el usuario cambia la hora en pantalla, actualizamos la fecha automáticamente para que coincida.
  onScheduleChange(groupName: string, group: any) {
    const dates = this.getAvailableDates(group);
    if (dates.length > 0) {
      this.selectedDates[groupName] = dates[0];
    } else {
      this.selectedDates[groupName] = '';
    }
  }

  // Pone la fecha bonita en español para que el usuario la entienda mejor (ej: "Lunes, 15 de mayo").
  formatDateToSpanish(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  }

  // Envía la petición al servidor para guardar la plaza del alumno en la clase.
  bookClass(activityName: string) {
    const idClass = this.selectedSchedules[activityName];
    const chosenDate = this.selectedDates[activityName];

    if (!idClass) {
      alert(' Por favor, selecciona un horario de la lista.');
      return;
    }

    if (!chosenDate) {
      alert('Por favor, selecciona una fecha válida para asistir.');
      return;
    }

    this.classService.bookClass(idClass, chosenDate).subscribe({
      next: (res) => {
        alert(res.message || ' ¡Reserva confirmada!');
      },
      error: (err) => {
        const mensaje = typeof err.error === 'string' ? err.error : (err.error?.message || 'Error al realizar la reserva.');
        alert(mensaje);
      }
    });
  }
}
