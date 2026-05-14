using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
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
    public IActionResult SendRequest([FromBody] SendRequestDto dto)
    {
        var myUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var client = _context.Clients.FirstOrDefault(c => c.IdUser == myUserId);
        
        if (client == null) return BadRequest(new { message = "Debes ser un cliente para solicitar un coach." });

        var existingRequest = _context.WorkerRequests.FirstOrDefault(r => 
            r.IdClient == client.IdClient && 
            r.IdWorker == dto.WorkerId && 
            (r.Status == "Pending" || r.Status == "Accepted"));

        if (existingRequest != null)
        {
            return BadRequest(new { message = "Ya tienes una solicitud o sesión activa con este entrenador." });
        }

        var newRequest = new WorkerRequest
        {
            IdClient = client.IdClient,
            IdWorker = dto.WorkerId,
            Status = "Pending",
            RequestDate = DateTime.Now,
            RequestedDay = dto.RequestedDay,
            RequestedTime = dto.RequestedTime
        };

        _context.WorkerRequests.Add(newRequest);
        _context.SaveChanges();

        return Ok(new { message = "¡Solicitud enviada correctamente!" });
    }

    [HttpGet("worker/{workerId}")]
    public IActionResult GetWorkerRequests(int workerId)
    {
        var requests = (from r in _context.WorkerRequests
                       join c in _context.Clients on r.IdClient equals c.IdClient
                       join u in _context.Users on c.IdUser equals u.IdUser
                       where r.IdWorker == workerId
                       select new {
                           requestId = r.IdRequest,
                           clientName = u.Name,
                           status = r.Status,
                           requestedDay = r.RequestedDay,
                           requestedTime = r.RequestedTime,
                           modality = c.Modality 
                       }).ToList();

        return Ok(requests);
    }

    // 🚀 NUEVO: Endpoint para el Cliente
    [HttpGet("client/{clientId}")]
    public IActionResult GetClientRequests(int clientId)
    {
        var requests = (from r in _context.WorkerRequests
                       join w in _context.Workers on r.IdWorker equals w.IdWorker
                       join u in _context.Users on w.IdUser equals u.IdUser
                       where r.IdClient == clientId
                       select new {
                           requestId = r.IdRequest,
                           workerName = u.Name,
                           status = r.Status,
                           requestedDay = r.RequestedDay,
                           requestedTime = r.RequestedTime
                       }).ToList();

        return Ok(requests);
    }

    [HttpPut("update-status/{requestId}")]
    public IActionResult UpdateStatus(int requestId, [FromBody] string newStatus)
    {
        var request = _context.WorkerRequests.Find(requestId);
        if (request == null) return NotFound();

        request.Status = newStatus;

        if (newStatus == "Accepted")
        {
            var client = _context.Clients.FirstOrDefault(c => c.IdClient == request.IdClient);

            var session = new Session
            {
                IdClient = request.IdClient,
                IdWorker = request.IdWorker,
                IdRequest = request.IdRequest,
                ScheduledDate = DateTime.Now.AddDays(7),
                DayOfWeek = request.RequestedDay ?? client?.PrefDay ?? "Monday",
                StartTime = request.RequestedTime ?? client?.PrefTime ?? new TimeSpan(10, 0, 0),
                Status = "Scheduled",
                DurationMinutes = 60
            };

            _context.Sessions.Add(session);
        }

        _context.SaveChanges();
        return Ok(new { message = $"Solicitud {newStatus} correctamente." });
    }
}

public class SendRequestDto
{
    public int WorkerId { get; set; }
    public string RequestedDay { get; set; } = string.Empty;
    public TimeSpan RequestedTime { get; set; }
}