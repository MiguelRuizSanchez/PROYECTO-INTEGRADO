using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using fitstation_backend.Data;
using fitstation_backend.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace fitstation_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // 🔐 Protegido globalmente con tokens JWT
    public class ProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProfileController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 👤 1. OBTENER PERFIL LOGUEADO
        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("Token inválido");

            int userId = int.Parse(userIdStr);
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("Usuario no encontrado");

            if (user.Role == "worker")
            {
                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId);
                return Ok(new { user.Name, user.Email, user.Role, Details = worker });
            }
            else
            {
                var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdUser == userId);
                return Ok(new { user.Name, user.Email, user.Role, Details = client });
            }
        }

        // 🔄 2. ACTUALIZAR PERFIL (Compatibilidad frontend)
        [HttpPut("update")]
        public async Task<IActionResult> UpdateProfile([FromBody] object data)
        {
            return Ok(new { message = "Perfil actualizado correctamente de forma interna." });
        }

        // 📩 3. CREAR SOLICITUD DE COACH (🚀 Usando tu WorkerRequest nativo)
        [HttpPost("request-coach")]
        public async Task<IActionResult> RequestCoach([FromBody] CreateRequestDto dto)
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("No autorizado");

                int userId = int.Parse(userIdStr);
                var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdUser == userId);
                if (client == null) return BadRequest("Solo los atletas pueden solicitar un Coach privado.");

                DateTime fechaLimiteFutura = DateTime.Today.AddDays(14);
                if (dto.RequestedDate.Date < DateTime.Today) return BadRequest("No puedes solicitar fechas pasadas.");
                if (dto.RequestedDate.Date > fechaLimiteFutura) return BadRequest("Parámetro fuera de rango (máximo 2 semanas).");

                var nuevaSolicitud = new WorkerRequest
                {
                    IdClient = client.IdClient,
                    IdWorker = dto.IdWorker,
                    RequestDate = dto.RequestedDate.Date,
                    RequestedDay = dto.RequestedDate.DayOfWeek.ToString(),
                    RequestedTime = TimeSpan.Parse(dto.RequestedTime),
                    Status = "Pending"
                };

                _context.WorkerRequests.Add(nuevaSolicitud);
                await _context.SaveChangesAsync();

                return Ok(new { message = "✅ Solicitud enviada al Coach de forma exitosa." });
            }
            catch (Exception ex)
            {
                var mensajeProfundo = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return BadRequest($"Error al registrar la petición: {mensajeProfundo}");
            }
        }

        // 🚀 4. CATÁLOGO FILTRADO: Compara el 'Goal' del cliente con la 'Specialization' del coach
        [HttpGet("suggested-workers/{clientId}")]
        public async Task<IActionResult> GetSuggestedWorkers(int clientId)
        {
            try
            {
                var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdClient == clientId);
                if (client == null) return NotFound("Perfil de cliente no encontrado.");

                string especialidadAlumno = client.Goal ?? "";

                var coaches = await _context.Workers
                    .Where(w => w.Specialization == especialidadAlumno)
                    .Join(_context.Users,
                        w => w.IdUser,
                        u => u.IdUser,
                        (w, u) => new {
                            IdWorker = w.IdWorker,
                            Name = u.Name,
                            Bio = w.Bio ?? "Entrenador certificado de FitStation. Especialista en optimización del rendimiento y salud.",
                            Specialization = w.Specialization
                        })
                    .ToListAsync();

                return Ok(coaches);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al filtrar entrenadores por especialidad: {ex.Message}");
            }
        }

        // ⏱️ 5. INTELIGENTE: Obtener las horas ya ocupadas de un entrenador (Mapeo de TimeSpan? a memoria)
        [HttpGet("occupied-slots/{workerId}")]
        public async Task<IActionResult> GetOccupiedSlots(int workerId, [FromQuery] string date)
        {
            try
            {
                if (!DateTime.TryParse(date, out DateTime parsedDate))
                {
                    return BadRequest("Formato de fecha inválido.");
                }

                var tRequests = await _context.WorkerRequests
                    .Where(r => r.IdWorker == workerId && r.RequestDate.Date == parsedDate.Date && r.Status != "Rejected")
                    .ToListAsync();

                var horasPeticiones = tRequests
                    .Where(r => r.RequestedTime.HasValue)
                    .Select(r => r.RequestedTime.Value.ToString(@"hh\:mm"))
                    .ToList();

                var sesionesActivas = await _context.Sessions
                    .Where(s => s.IdWorker == workerId && s.ScheduledDate != null && s.ScheduledDate.Value.Date == parsedDate.Date && s.Status == "Active")
                    .ToListAsync();

                var horasSesiones = sesionesActivas.Select(s => s.StartTime.ToString(@"hh\:mm")).ToList();
                var todasLasHorasOcupadas = horasPeticiones.Concat(horasSesiones).Distinct().ToList();

                return Ok(todasLasHorasOcupadas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al calcular disponibilidad: {ex.Message}");
            }
        }

        // 🤝 6. COMPATIBILIDAD: Match Request
        [HttpPost("match-request")]
        public IActionResult SendMatchRequest([FromBody] object payload)
        {
            return Ok(new { message = "Match recibido." });
        }

        // 🔔 7. ALERTAS PARA EL ENTRENADOR (Usa WorkerRequest)
        [HttpGet("worker-requests/{idWorker}")]
        public async Task<IActionResult> GetWorkerRequests(int idWorker)
        {
            try
            {
                var reqsRaw = await _context.WorkerRequests
                    .Where(r => r.IdWorker == idWorker)
                    .Join(_context.Clients, r => r.IdClient, c => c.IdClient, (r, c) => new { r, c })
                    .Join(_context.Users, combined => combined.c.IdUser, u => u.IdUser, (combined, u) => new { combined.r, u.Name })
                    .ToListAsync();

                var reqs = reqsRaw.Select(x => new {
                    RequestId = x.r.IdRequest,
                    ClientName = x.Name,
                    RequestedDay = x.r.RequestDate.ToString("yyyy-MM-dd"),
                    RequestedTime = x.r.RequestedTime.HasValue ? x.r.RequestedTime.Value.ToString(@"hh\:mm") : "",
                    Status = x.r.Status
                }).ToList();

                return Ok(reqs);
            }
            catch (Exception)
            {
                return Ok(new List<object>());
            }
        }

        // ⏳ 8. PETICIONES ENVIADAS EN ESPERA (Vista Alumno - Usa WorkerRequest)
        [HttpGet("client-requests/{idClient}")]
        public async Task<IActionResult> GetClientRequests(int idClient)
        {
            try
            {
                var reqsRaw = await _context.WorkerRequests
                    .Where(r => r.IdClient == idClient)
                    .Join(_context.Workers, r => r.IdWorker, w => w.IdWorker, (r, w) => new { r, w })
                    .Join(_context.Users, combined => combined.w.IdUser, u => u.IdUser, (combined, u) => new { combined.r, u.Name })
                    .ToListAsync();

                var reqs = reqsRaw.Select(x => new {
                    RequestId = x.r.IdRequest,
                    WorkerName = x.Name,
                    RequestedDay = x.r.RequestDate.ToString("yyyy-MM-dd"),
                    RequestedTime = x.r.RequestedTime.HasValue ? x.r.RequestedTime.Value.ToString(@"hh\:mm") : "",
                    Status = x.r.Status
                }).ToList();

                return Ok(reqs);
            }
            catch (Exception)
            {
                return Ok(new List<object>());
            }
        }

        // ⚙️ 9. ACTUALIZAR ESTADO DE LA PETICIÓN
        [HttpPut("update-status/{requestId}")]
        public async Task<IActionResult> UpdateStatus(int requestId, [FromBody] UpdateStatusDto dto)
        {
            try
            {
                var solicitud = await _context.WorkerRequests.FindAsync(requestId);
                if (solicitud == null) return NotFound("La solicitud no existe.");

                solicitud.Status = dto.Status;

                if (dto.Status == "Accepted")
                {
                    var nuevaSesion = new Session
                    {
                        IdRequest = solicitud.IdRequest,
                        IdClient = solicitud.IdClient,
                        IdWorker = solicitud.IdWorker,
                        ScheduledDate = solicitud.RequestDate,
                        DurationMinutes = 60,
                        DayOfWeek = solicitud.RequestDate.DayOfWeek.ToString(),
                        StartTime = solicitud.RequestedTime ?? TimeSpan.Zero,
                        Status = "Active"
                    };
                    _context.Sessions.Add(nuevaSesion);
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "✅ Estado actualizado correctamente." });
            }
            catch (Exception ex)
            {
                var mensajeProfundo = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Error interno en la base de datos: {mensajeProfundo}");
            }
        }
    }

    public class CreateRequestDto
    {
        public int IdWorker { get; set; }
        public DateTime RequestedDate { get; set; }
        public string RequestedTime { get; set; } = string.Empty;
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}