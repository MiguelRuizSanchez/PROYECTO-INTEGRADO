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

    // CAMBIO - fuera int clientId de los parametros porque lo sacamos del token para identificar el user
    [HttpPost("send")]
    public IActionResult SendRequest(int workerId)
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userId = int.Parse(claimValue);

        // CAMBIO - busca si existe al cliente a partir del userId
        var client = _context.Clients.FirstOrDefault(c => c.IdUser == userId);
        if (client == null)
            return NotFound(new { message = "No se encontró el perfil del cliente." });

        var existing = _context.WorkerRequests.FirstOrDefault(r =>
            r.IdClient == client.IdClient && r.IdWorker == workerId && r.Status == "Pending");

        if (existing != null)
            return BadRequest(new { message = "Ya tienes una solicitud pendiente con este entrenador." });

        var newRequest = new WorkerRequest
        {
            IdClient = client.IdClient, // habia otra entidad
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

        // CAMBIO - busca el perfil del trabajador para comparar IdWorker real
        var workerProfile = _context.Workers.FirstOrDefault(w => w.IdUser == userId);
        if (workerProfile == null || workerProfile.IdWorker != workerId)
            return Forbid();

        // CAMBIO - hace el Doble Join (Requests -> Clients -> Users) para evitar el error de BD
        var requestsWithNames = _context.WorkerRequests
            .Where(r => r.IdWorker == workerId)
            .Join(_context.Clients,
                request => request.IdClient,
                c => c.IdClient,
                (request, c) => new { request, c.IdUser }) 
            .Join(_context.Users,
                rc => rc.IdUser,
                user => user.IdUser,
                (rc, user) => new {                        // Saltamos a la tabla Users
                    RequestId = rc.request.IdRequest,
                    ClientId = rc.request.IdClient,
                    ClientName = user.Name,
                    Date = rc.request.RequestDate,
                    Status = rc.request.Status,
                    DayRequested = rc.request.RequestedDay,
                    TimeRequested = rc.request.RequestedTime
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

        // CAMBIO - busca el perfil del cliente para comparar IdClient real
        var clientProfile = _context.Clients.FirstOrDefault(c => c.IdUser == userId);
        if (clientProfile == null || clientProfile.IdClient != clientId)
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

        // CAMBIO - busca si existe el IdWorker del perfil del trabajador
        var workerProfile = _context.Workers.FirstOrDefault(w => w.IdUser == userId);
        if (workerProfile == null || request.IdWorker != workerProfile.IdWorker)
            return Forbid();

        request.Status = newStatus;

        if (newStatus == "Accepted")
        {
            DateTime startDate = DateTime.Today;

            // CAMBIO - extrae targetTime para poder validar la fecha
            DayOfWeek targetDay = Enum.Parse<DayOfWeek>(request.RequestedDay ?? "Monday", true);
            TimeSpan targetTime = request.RequestedTime ?? new TimeSpan(10, 0, 0);

            while (startDate.DayOfWeek != targetDay)
            {
                startDate = startDate.AddDays(1);
            }

            // CAMBIO - evita que se genere la primera sesión en el pasado si ya ha pasado la hora de hoy
            if (startDate == DateTime.Today && DateTime.Now.TimeOfDay > targetTime)
            {
                startDate = startDate.AddDays(7);
            }

            for (int i = 0; i < 4; i++)
            {
                var sessionDate = startDate.AddDays(i * 7);

                var newSession = new Session
                {
                    IdRequest = request.IdRequest,
                    IdClient = request.IdClient,
                    IdWorker = request.IdWorker,
                    ScheduledDate = sessionDate.Date.Add(targetTime), 
                    DurationMinutes = 60,
                    DayOfWeek = request.RequestedDay ?? "Monday",
                    StartTime = targetTime, 
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