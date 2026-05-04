using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using fitstation_backend.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization; // Importante para que funcione el [Authorize]
using System.Security.Claims;

namespace fitstation_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // <--- ESTE ES EL CAMBIO: Ahora todo este controlador está protegido
public class SessionController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SessionController(ApplicationDbContext context)
    {
        _context = context;
    }

    // 1. OBTENER LA AGENDA DE UN ENTRENADOR
    [HttpGet("worker/{workerId}")]
    public IActionResult GetWorkerSessions(int workerId)
    {
        var sessions = _context.Sessions
            .Where(s => s.IdWorker == workerId)
            .Join(_context.Users,
                session => session.IdClient,
                user => user.IdUser,
                (session, user) => new SessionDetailsDto
                {
                    SessionId = session.IdSession,
                    ClientName = user.Name,
                    DayOfWeek = session.DayOfWeek,
                    StartTime = session.StartTime,
                    Status = session.Status
                })
            .ToList();

        return Ok(sessions);
    }

    // 2. ACTUALIZAR EL ESTADO DE UNA SESIÓN (Completada / Cancelada)
    [HttpPut("update-status/{sessionId}")]
    public IActionResult UpdateSessionStatus(int sessionId, [FromBody] string newStatus)
    {
        var session = _context.Sessions.Find(sessionId);
        if (session == null) return NotFound("Sesión no encontrada");

        // Lista de estados permitidos para mantener el orden en la DB
        var validStatuses = new List<string> { "Scheduled", "Completed", "Cancelled", "Absent" };

        if (!validStatuses.Contains(newStatus))
        {
            return BadRequest(new
            {
                message = $"Estado no válido. Usa uno de estos: {string.Join(", ", validStatuses)}"
            });
        }

        session.Status = newStatus;
        _context.SaveChanges();

        return Ok(new { message = $"Sesión {sessionId} marcada como: {newStatus}" });
    }
    [HttpGet("client/{clientId}")]
    [Authorize]
    public IActionResult GetClientSessions(int clientId)
    {
        var claimValue = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();

        var userId = int.Parse(claimValue);

        if (userId != clientId) return Forbid();

        var sessions = _context.Sessions
            .Where(s => s.IdClient == clientId) // Usamos IdClient según tu modelo
            .Select(s => new {
                s.IdSession,
                s.IdWorker,
                WorkerName = _context.Users
                    .Where(u => u.IdUser == s.IdWorker) // Usamos IdUser según tu modelo
                    .Select(u => u.Name)
                    .FirstOrDefault(),
                s.DayOfWeek,
                s.StartTime
            })
            .ToList();

        return Ok(sessions);
    }
    [HttpPut("cancel/{sessionId}")]
    public IActionResult CancelSession(int sessionId)
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userId = int.Parse(claimValue);

        var session = _context.Sessions.Find(sessionId);
        if (session == null) return NotFound("Sesión no encontrada");

        // SEGURIDAD: Solo el cliente o el trabajador de ESA sesión pueden cancelarla
        if (session.IdClient != userId && session.IdWorker != userId)
        {
            return Forbid("No tienes permiso para cancelar esta sesión");
        }

        session.Status = "Cancelled";
        _context.SaveChanges();

        return Ok(new { message = "La sesión ha sido cancelada correctamente." });
    }
}