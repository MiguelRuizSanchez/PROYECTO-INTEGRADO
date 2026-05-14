using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace fitstation_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SessionController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SessionController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("client/{clientId}")]
    public IActionResult GetClientSessions(int clientId)
    {
        var sessions = (from s in _context.Sessions
                       join w in _context.Workers on s.IdWorker equals w.IdWorker
                       join u in _context.Users on w.IdUser equals u.IdUser
                       where s.IdClient == clientId
                       select new {
                           idSession = s.IdSession,
                           workerName = u.Name,
                           scheduledDate = s.ScheduledDate,
                           dayOfWeek = s.DayOfWeek,
                           startTime = s.StartTime,
                           status = s.Status
                       }).ToList();
        return Ok(sessions);
    }

    [HttpGet("worker/{workerId}")]
    public IActionResult GetWorkerSessions(int workerId)
    {
        var sessions = (from s in _context.Sessions
                       join c in _context.Clients on s.IdClient equals c.IdClient
                       join u in _context.Users on c.IdUser equals u.IdUser
                       where s.IdWorker == workerId
                       select new {
                           idSession = s.IdSession,
                           clientName = u.Name,
                           scheduledDate = s.ScheduledDate,
                           dayOfWeek = s.DayOfWeek,
                           startTime = s.StartTime,
                           status = s.Status,
                           objectives = c.Objectives
                       }).ToList();
        return Ok(sessions);
    }

    [HttpPut("finish/{sessionId}")]
    public IActionResult FinishSession(int sessionId)
    {
        var session = _context.Sessions.Find(sessionId);
        if (session == null) return NotFound();

        session.Status = "Completed";

        // Al completar la sesión, también marcamos la request como finalizada
        var request = _context.WorkerRequests.Find(session.IdRequest);
        if (request != null) request.Status = "Completed";

        _context.SaveChanges();
        return Ok(new { message = "Sesión finalizada. El slot ha sido liberado." });
    }

    [HttpGet("details/{sessionId}")]
    public IActionResult GetDetails(int sessionId)
    {
        var session = _context.Sessions.Find(sessionId);
        if (session == null) return NotFound();

        var myUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var client = _context.Clients.First(c => c.IdClient == session.IdClient);
        var worker = _context.Workers.First(w => w.IdWorker == session.IdWorker);

        var otherUserId = (myUserId == client.IdUser) ? worker.IdUser : client.IdUser;
        var otherName = _context.Users.First(u => u.IdUser == otherUserId).Name;

        return Ok(new { 
            session, 
            otherUserId, 
            otherName,
            modalidad = client.Modality,
            especialidadEntrenador = worker.Specialty
        });
    }

    // Añade este método dentro de tu SessionController
[HttpGet("occupied-slots/{workerId}/{day}")]
public IActionResult GetOccupiedSlots(int workerId, string day)
{
    var occupied = _context.Sessions
        .Where(s => s.IdWorker == workerId && s.DayOfWeek == day && s.Status != "Completed")
        .Select(s => s.StartTime.ToString(@"hh\:mm"))
        .ToList();
    
    // También restamos las peticiones pendientes para que no se pisen
    var pendingRequests = _context.WorkerRequests
        .Where(r => r.IdWorker == workerId && r.RequestedDay == day && r.Status == "Pending")
        .Select(r => r.RequestedTime.HasValue ? r.RequestedTime.Value.ToString(@"hh\:mm") : "")
        .ToList();

    occupied.AddRange(pendingRequests);
    return Ok(occupied.Distinct());
}
}