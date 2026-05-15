using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using fitstation_backend.Data;
using fitstation_backend.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace fitstation_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // 🔐 Protegido globalmente por seguridad básica
    public class ClassController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClassController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 📋 1. CATÁLOGO GLOBAL: Abierto al público para poder probarlo en el navegador
        [HttpGet("available")]
        [AllowAnonymous] // 🚀 MÁGICO: Permite el acceso sin token solo para leer las clases disponibles
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
                            TrainerName = u != null ? u.Name : "Por asignar"
                        })
                    .ToListAsync();

                return Ok(clases);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al cargar el catálogo de clases: {ex.Message}");
            }
        }

        // 🎯 2. RESERVA DIRECTA: Requiere Token JWT obligatorio
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

                var yaReservado = await _context.Bookings
                    .AnyAsync(b => b.IdClient == client.IdClient && b.IdClass == dto.IdClass);
                if (yaReservado) return BadRequest("Ya te has apuntado a esta clase colectiva.");

                var nuevaReserva = new Booking
                {
                    IdClient = client.IdClient,
                    IdClass = dto.IdClass,
                    BookingDate = DateTime.Now,
                    Status = "Accepted"
                };

                _context.Bookings.Add(nuevaReserva);
                await _context.SaveChangesAsync();

                return Ok(new { message = "✅ ¡Reserva confirmada con éxito!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Fallo en la reserva de base de datos: {ex.Message}");
            }
        }

        // 📅 3. VISTA CALENDARIO CLIENTE: Requiere Token JWT obligatorio
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
                            DayOfWeek = c.DayOfWeek,
                            ClassTime = c.ClassTime,
                            Status = b.Status
                        })
                    .ToListAsync();

                return Ok(misClasesColectivas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al procesar el calendario del alumno: {ex.Message}");
            }
        }

        // 👔 4. VISTA CALENDARIO ENTRENADOR: Requiere Token JWT obligatorio
        [HttpGet("worker-calendar")]
        public async Task<IActionResult> GetWorkerClassCalendar()
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                                User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("No identificado");

                int userId = int.Parse(userIdStr);
                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId);
                if (worker == null) return BadRequest("Perfil de entrenador no encontrado.");

                var misTurnosLaborales = await _context.Classes
                    .Where(c => c.IdWorker == worker.IdWorker)
                    .Select(c => new {
                        IdClass = c.IdClass,
                        ClassName = c.Name,
                        DayOfWeek = c.DayOfWeek,
                        ClassTime = c.ClassTime
                    })
                    .ToListAsync();

                return Ok(misTurnosLaborales);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al procesar los turnos del entrenador: {ex.Message}");
            }
        }
    }

    public class BookClassDto
    {
        public int IdClass { get; set; }
    }
}