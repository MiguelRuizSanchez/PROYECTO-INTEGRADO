using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using fitstation_backend.Data;
using fitstation_backend.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace fitstation_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] 
    public class ClassController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClassController(ApplicationDbContext context)
        {
            _context = context;
        }

        // CLASES DISPONIBLES PARA EL PÚBLICO
        [HttpGet("available")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvailableClasses()
        {
            try
            {
                var clases = await _context.Classes
                    .GroupJoin(_context.Workers,
                        c => c.IdWorker,
                        w => w.IdWorker,
                        (c, workers) => new { c, workers })
                    .SelectMany(
                        x => x.workers.DefaultIfEmpty(),
                        (x, w) => new { x.c, w })
                    .GroupJoin(_context.Users,
                        combined => combined.w != null ? combined.w.IdUser : 0,
                        u => u.IdUser,
                        (combined, users) => new { combined.c, combined.w, users })
                    .SelectMany(
                        x => x.users.DefaultIfEmpty(),
                        (x, u) => new {
                            IdClass = x.c.IdClass,
                            Name = x.c.Name,
                            Description = x.c.Description,
                            DayOfWeek = x.c.DayOfWeek,
                            ClassTime = x.c.ClassTime,
                            TrainerName = u != null ? u.Name : "Por asignar",
                            IdWorker = x.c.IdWorker 
                        })
                    .ToListAsync();

                return Ok(clases);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al cargar el catálogo de clases: {ex.Message}");
            }
        }

        // RESERVA VALIDANDO FECHA Y DUPLICADO
        [HttpPost("book")]
        public async Task<IActionResult> BookClass([FromBody] BookClassDto dto)
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                                User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("Token no válido");

                int userId = int.Parse(userIdStr);
                var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdUser == userId);
                if (client == null) return BadRequest("Solo los clientes pueden reservar clases colectivas.");

                DateTime fechaLimiteFutura = DateTime.Today.AddDays(14);
                if (dto.ChosenDate.Date < DateTime.Today)
                {
                    return BadRequest("No puedes reservar una clase en una fecha pasada.");
                }
                if (dto.ChosenDate.Date > fechaLimiteFutura)
                {
                    return BadRequest("Solo puedes reservar clases con un máximo de 2 semanas de antelación.");
                }

                var yaReservado = await _context.Bookings
                    .AnyAsync(b => b.IdClient == client.IdClient && 
                                   b.IdClass == dto.IdClass && 
                                   b.BookingDate.Date == dto.ChosenDate.Date);
                
                if (yaReservado) return BadRequest("Ya tienes una plaza reservada para esta clase en la fecha elegida.");

                var nuevaReserva = new Booking
                {
                    IdClient = client.IdClient,
                    IdClass = dto.IdClass,
                    BookingDate = dto.ChosenDate.Date,
                    Status = "Accepted"
                };

                _context.Bookings.Add(nuevaReserva);
                await _context.SaveChangesAsync();

                return Ok(new { message = "✅ ¡Reserva confirmada con éxito para el día elegido!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Fallo en la reserva de base de datos: {ex.Message}");
            }
        }

        // CALENDARIO CLIENTE
        [HttpGet("client-calendar")]
        public async Task<IActionResult> GetClientClassCalendar()
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                                User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("No identificado");

                int userId = int.Parse(userIdStr);
                var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdUser == userId);
                if (client == null) return BadRequest("Perfil de cliente no encontrado.");

                var misClasesColectivas = await _context.Bookings
                    .Where(b => b.IdClient == client.IdClient)
                    .Join(_context.Classes,
                        b => b.IdClass,
                        c => c.IdClass,
                        (b, c) => new {
                            IdBooking = b.IdBooking, 
                            ClassName = c.Name,
                            BookingDate = b.BookingDate,
                            ClassTime = c.ClassTime,
                            Status = b.Status
                        })
                    .ToListAsync();

                return Ok(misClasesColectivas);
            }
            catch (Exception ex) {
                return StatusCode(500, $"Error al procesar el calendario del alumno: {ex.Message}");
            }
        }

        // CALENDARIO ENTRENADOR
        [HttpGet("worker-calendar")]
        public async Task<IActionResult> GetWorkerClassCalendar()
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("No identificado");

                int userId = int.Parse(userIdStr);
                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId);
                if (worker == null) return BadRequest("Perfil de entrenador no encontrado.");

                string createTableSql = @"
                    CREATE TABLE IF NOT EXISTS `worker_class_assignments` (
                        `id_assignment` INT AUTO_INCREMENT PRIMARY KEY,
                        `id_worker` INT NOT NULL,
                        `id_class` INT NOT NULL,
                        `assignment_date` DATE NOT NULL
                    );";
                await _context.Database.ExecuteSqlRawAsync(createTableSql);

                var misTurnosLaborales = new List<object>();
                
                using (var command = _context.Database.GetDbConnection().CreateCommand())
                {
                    command.CommandText = @"
                        SELECT wca.id_assignment, wca.assignment_date, c.id_class, c.name, c.day_of_week, c.class_time 
                        FROM worker_class_assignments wca
                        JOIN classes c ON wca.id_class = c.id_class
                        WHERE wca.id_worker = @workerId";
                    
                    var parameter = command.CreateParameter();
                    parameter.ParameterName = "@workerId";
                    parameter.Value = worker.IdWorker;
                    command.Parameters.Add(parameter);

                    if (command.Connection?.State != System.Data.ConnectionState.Open)
                        await (command.Connection?.OpenAsync() ?? Task.CompletedTask);

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            misTurnosLaborales.Add(new {
                                IdAssignment = reader.GetInt32(0),
                                BookingDate = reader.GetDateTime(1).ToString("yyyy-MM-dd"),
                                IdClass = reader.GetInt32(2),
                                ClassName = reader.GetString(3),
                                DayOfWeek = reader.GetString(4),
                                ClassTime = reader.GetValue(5)?.ToString() ?? "00:00:00",
                                IdWorker = worker.IdWorker
                            });
                        }
                    }
                }

                return Ok(misTurnosLaborales);
            }
            catch (Exception ex) {
                return StatusCode(500, $"Error al procesar los turnos del entrenador: {ex.Message}");
            }
        }

        // CANCELA RESERVA
        [HttpDelete("cancel/{idBooking}")]
        public async Task<IActionResult> CancelBooking(int idBooking)
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                                User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("No identificado");

                int userId = int.Parse(userIdStr);
                var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdUser == userId);
                if (client == null) return BadRequest("Perfil de cliente no encontrado.");

                var reserva = await _context.Bookings
                    .FirstOrDefaultAsync(b => b.IdBooking == idBooking && b.IdClient == client.IdClient);

                if (reserva == null) return NotFound("La reserva no existe o no tienes autorización para cancelarla.");

                _context.Bookings.Remove(reserva);
                await _context.SaveChangesAsync();

                return Ok(new { message = "❌ Reserva de clase grupal cancelada correctamente." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error crítico al procesar la cancelación en el servidor: {ex.Message}");
            }
        }

        // ASIGNACION ENTRENADOR - CLASE - FECHA
        [HttpPost("assign/{idClass}")]
        public async Task<IActionResult> AssignTrainerToClass(int idClass, [FromQuery] string chosenDate)
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("No identificado");

                int userId = int.Parse(userIdStr);
                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId);
                if (worker == null) return BadRequest("Perfil de entrenador no encontrado.");

                var claseColectiva = await _context.Classes.FirstOrDefaultAsync(c => c.IdClass == idClass);
                if (claseColectiva == null) return NotFound("La clase colectiva solicitada no existe.");

                if (string.IsNullOrEmpty(chosenDate)) return BadRequest("Debe especificar la fecha exacta para este turno.");
                DateTime dateValue = DateTime.Parse(chosenDate);

                string createTableSql = @"
                    CREATE TABLE IF NOT EXISTS `worker_class_assignments` (
                        `id_assignment` INT AUTO_INCREMENT PRIMARY KEY,
                        `id_worker` INT NOT NULL,
                        `id_class` INT NOT NULL,
                        `assignment_date` DATE NOT NULL
                    );";
                await _context.Database.ExecuteSqlRawAsync(createTableSql);

                using (var command = _context.Database.GetDbConnection().CreateCommand())
                {
                    command.CommandText = "SELECT COUNT(*) FROM worker_class_assignments WHERE id_worker = @workerId AND id_class = @classId AND assignment_date = @assignDate";
                    
                    var p1 = command.CreateParameter(); p1.ParameterName = "@workerId"; p1.Value = worker.IdWorker; command.Parameters.Add(p1);
                    var p2 = command.CreateParameter(); p2.ParameterName = "@classId"; p2.Value = idClass; command.Parameters.Add(p2);
                    var p3 = command.CreateParameter(); p3.ParameterName = "@assignDate"; p3.Value = dateValue.Date; command.Parameters.Add(p3);

                    if (command.Connection?.State != System.Data.ConnectionState.Open) 
                        await (command.Connection?.OpenAsync() ?? Task.CompletedTask);

                    long count = Convert.ToInt64(await command.ExecuteScalarAsync());
                    if (count > 0) return BadRequest("Ya tienes asignada esta clase para la fecha seleccionada.");
                }

                using (var command = _context.Database.GetDbConnection().CreateCommand())
                {
                    command.CommandText = "INSERT INTO worker_class_assignments (id_worker, id_class, assignment_date) VALUES (@workerId, @classId, @assignDate)";
                    
                    var p1 = command.CreateParameter(); p1.ParameterName = "@workerId"; p1.Value = worker.IdWorker; command.Parameters.Add(p1);
                    var p2 = command.CreateParameter(); p2.ParameterName = "@classId"; p2.Value = idClass; command.Parameters.Add(p2);
                    var p3 = command.CreateParameter(); p3.ParameterName = "@assignDate"; p3.Value = dateValue.Date; command.Parameters.Add(p3);

                    if (command.Connection?.State != System.Data.ConnectionState.Open) 
                        await (command.Connection?.OpenAsync() ?? Task.CompletedTask);

                    await command.ExecuteNonQueryAsync();
                }

                return Ok(new { message = "✅ ¡Te has asignado este turno de forma exclusiva para el día elegido!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno al guardar la asignación: {ex.Message}");
            }
        }

        // LIBERA ENTRENADOR
        [HttpPost("unassign/{idClass}")]
        public async Task<IActionResult> UnassignTrainerFromClass(int idClass, [FromQuery] string chosenDate)
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("No identificado");

                int userId = int.Parse(userIdStr);
                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId);
                if (worker == null) return BadRequest("Perfil de entrenador no encontrado.");

                if (string.IsNullOrEmpty(chosenDate)) return BadRequest("Debe especificar la fecha exacta.");
                DateTime dateValue = DateTime.Parse(chosenDate);

                using (var command = _context.Database.GetDbConnection().CreateCommand())
                {
                    command.CommandText = "DELETE FROM worker_class_assignments WHERE id_worker = @workerId AND id_class = @classId AND assignment_date = @assignDate";
                    
                    var p1 = command.CreateParameter(); p1.ParameterName = "@workerId"; p1.Value = worker.IdWorker; command.Parameters.Add(p1);
                    var p2 = command.CreateParameter(); p2.ParameterName = "@classId"; p2.Value = idClass; command.Parameters.Add(p2);
                    var p3 = command.CreateParameter(); p3.ParameterName = "@assignDate"; p3.Value = dateValue.Date; command.Parameters.Add(p3);

                    if (command.Connection?.State != System.Data.ConnectionState.Open) 
                        await (command.Connection?.OpenAsync() ?? Task.CompletedTask);

                    int rowsAffected = await command.ExecuteNonQueryAsync();
                    
                    if (rowsAffected == 0) return BadRequest("No tienes una asignación registrada para esta fecha específica.");
                }

                return Ok(new { message = "✕ Has cancelado tu turno laboral para el día elegido." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno al liberar la clase: {ex.Message}");
            }
        }
    }

    public class BookClassDto
    {
        public int IdClass { get; set; }
        public DateTime ChosenDate { get; set; }
    }
}