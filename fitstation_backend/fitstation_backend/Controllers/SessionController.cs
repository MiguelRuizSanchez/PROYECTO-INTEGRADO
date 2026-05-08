using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using fitstation_backend.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace fitstation_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
        // CAMBIO - comprueba que el que pide la agenda es dueño de la misma
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userId = int.Parse(claimValue);

        var workerProfile = _context.Workers.FirstOrDefault(w => w.IdUser == userId);
        if (workerProfile == null || workerProfile.IdWorker != workerId)
            return Forbid();
        // FIN DEL CAMBIO

        var sessions = _context.Sessions
            .Where(s => s.IdWorker == workerId)
            .Join(_context.Clients,
                session => session.IdClient,
                client => client.IdClient,
                (session, client) => new { session, client })
            .Join(_context.Users,
                sc => sc.client.IdUser,
                user => user.IdUser,
                (sc, user) => new SessionDetailsDto
                {
                    SessionId = sc.session.IdSession,
                    ClientName = user.Name,
                    DayOfWeek = sc.session.DayOfWeek,
                    StartTime = sc.session.StartTime,
                    Status = sc.session.Status
                })
            .ToList();

        return Ok(sessions);
    }

    // 2. ACTUALIZAR EL ESTADO DE UNA SESIÓN (Completada / Cancelada)
    [HttpPut("update-status/{sessionId}")]
    public IActionResult UpdateSessionStatus(int sessionId, [FromBody] string newStatus)
    {
        // CAMBIO - antes cualquiera podía actualizar cualquier sesión

        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userId = int.Parse(claimValue);

        var session = _context.Sessions.Find(sessionId);
        if (session == null) return NotFound("Sesión no encontrada");

        var workerProfile = _context.Workers.FirstOrDefault(w => w.IdUser == userId);
        if (workerProfile == null || session.IdWorker != workerProfile.IdWorker)
            return Forbid("No tienes permiso para modificar esta sesión");
        // FIN DEL CAMBIO

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

        // CAMBIO: Comparar clientId de la URL con el IdClient real del usuario
        var clientProfile = _context.Clients.FirstOrDefault(c => c.IdUser == userId);
        if (clientProfile == null || clientProfile.IdClient != clientId)
            return Forbid();
        // FIN DEL CAMBIO

        var sessions = _context.Sessions
            .Where(s => s.IdClient == clientId)
            .Select(s => new {
                s.IdSession,
                s.IdWorker,
                // CAMBIO - arreglado el salto para buscar el nombre del trabajador correctamente
                WorkerName = _context.Workers
                    .Where(w => w.IdWorker == s.IdWorker)
                    .Join(_context.Users, w => w.IdUser, u => u.IdUser, (w, u) => u.Name)
                    .FirstOrDefault(),
                // FIN DEL CAMBIO
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

        // CAMBIO - no comparar IdUser contra IdClient/IdWorker para ver la sesion 
        var clientProfile = _context.Clients.FirstOrDefault(c => c.IdUser == userId);
        var workerProfile = _context.Workers.FirstOrDefault(w => w.IdUser == userId);

        bool isClientOwner = clientProfile != null && session.IdClient == clientProfile.IdClient;
        bool isWorkerOwner = workerProfile != null && session.IdWorker == workerProfile.IdWorker;

        if (!isClientOwner && !isWorkerOwner)
        {
            return Forbid("No tienes permiso para cancelar esta sesión");
        }
        // FIN DEL CAMBIO

        session.Status = "Cancelled";
        _context.SaveChanges();

        return Ok(new { message = "La sesión ha sido cancelada correctamente." });
    }
}