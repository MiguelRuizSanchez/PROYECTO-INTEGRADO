using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace fitstation_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RequestController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RequestController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("send")]
    public IActionResult SendRequest(int clientId, int workerId)
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userId = int.Parse(claimValue);

        if (userId != clientId)
            return Forbid();

        var client = _context.Clients.FirstOrDefault(c => c.IdUser == clientId);
        if (client == null)
            return NotFound(new { message = "No se encontró el perfil del cliente." });

        var existing = _context.WorkerRequests.FirstOrDefault(r =>
            r.IdClient == clientId && r.IdWorker == workerId && r.Status == "Pending");

        if (existing != null)
            return BadRequest(new { message = "Ya tienes una solicitud pendiente con este entrenador." });

        var newRequest = new WorkerRequest
        {
            IdClient = clientId,
            IdWorker = workerId,
            RequestDate = DateTime.Now,
            Status = "Pending",
            RequestedDay = client.PrefDay,
            RequestedTime = client.PrefTime
        };

        _context.WorkerRequests.Add(newRequest);
        _context.SaveChanges();

        return Ok(new
        {
            message = $"Solicitud enviada para los {client.PrefDay} a las {client.PrefTime}."
        });
    }

    [HttpGet("worker/{workerId}")]
    [Authorize(Roles = "worker")]
    public IActionResult GetWorkerRequests(int workerId)
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userId = int.Parse(claimValue);

        if (userId != workerId)
            return Forbid();

        var requestsWithNames = _context.WorkerRequests
            .Where(r => r.IdWorker == workerId)
            .Join(_context.Users,
                request => request.IdClient,
                user => user.IdUser,
                (request, user) => new {
                    RequestId = request.IdRequest,
                    ClientId = request.IdClient,
                    ClientName = user.Name,
                    Date = request.RequestDate,
                    Status = request.Status,
                    DayRequested = request.RequestedDay,
                    TimeRequested = request.RequestedTime
                })
            .ToList();

        return Ok(requestsWithNames);
    }

    [HttpGet("client/{clientId}")]
    public IActionResult GetClientRequests(int clientId)
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userId = int.Parse(claimValue);

        if (userId != clientId)
            return Forbid();

        var requests = _context.WorkerRequests
            .Where(r => r.IdClient == clientId)
            .ToList();

        return Ok(requests);
    }

    [HttpPut("update-status/{requestId}")]
    [Authorize(Roles = "worker")]
    public IActionResult UpdateStatus(int requestId, [FromBody] string newStatus)
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userId = int.Parse(claimValue);

        var request = _context.WorkerRequests.Find(requestId);
        if (request == null) return NotFound("Solicitud no encontrada");

        if (request.IdWorker != userId) return Forbid();

        request.Status = newStatus;

        if (newStatus == "Accepted")
        {
            // LOGICA DE SERVIDOR: Generar calendario para las próximas 4 semanas
            DateTime startDate = DateTime.Today;

            // Buscamos el primer día que coincida con lo que pidió el cliente (ej: próximo lunes)
            DayOfWeek targetDay = Enum.Parse<DayOfWeek>(request.RequestedDay ?? "Monday", true);
            while (startDate.DayOfWeek != targetDay)
            {
                startDate = startDate.AddDays(1);
            }

            for (int i = 0; i < 4; i++)
            {
                var sessionDate = startDate.AddDays(i * 7);

                var newSession = new Session
                {
                    IdRequest = request.IdRequest,
                    IdClient = request.IdClient,
                    IdWorker = request.IdWorker,
                    ScheduledDate = sessionDate.Date.Add(request.RequestedTime ?? new TimeSpan(10, 0, 0)),
                    DurationMinutes = 60,
                    DayOfWeek = request.RequestedDay ?? "Monday",
                    StartTime = request.RequestedTime ?? new TimeSpan(10, 0, 0),
                    Status = "Scheduled"
                };

                _context.Sessions.Add(newSession);
            }
        }

        _context.SaveChanges();

        return Ok(new
        {
            message = $"Solicitud aceptada. Se han generado 4 sesiones automáticamente en el servidor."
        });
    }
}