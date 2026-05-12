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
                           // Añadimos modalidad para que el Coach la vea antes de aceptar
                           modality = c.Modality 
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
            // 🛡️ Lógica de Creación de Sesión:
            // Buscamos al cliente para heredar su modalidad y preferencias
            var client = _context.Clients.FirstOrDefault(c => c.IdClient == request.IdClient);

            var session = new Session
            {
                IdClient = request.IdClient,
                IdWorker = request.IdWorker,
                IdRequest = request.IdRequest,
                // Programamos para la próxima semana por defecto
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