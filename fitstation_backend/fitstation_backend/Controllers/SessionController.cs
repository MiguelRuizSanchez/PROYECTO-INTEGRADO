using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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
            modalidad = client.Modality, // 👈 Lo que pide tu HTML
            especialidadEntrenador = worker.Specialty // 👈 Lo que pide tu HTML
        });
    }

    [HttpGet("client/{clientId}")]
    public IActionResult GetClientSessions(int clientId)
    {
        return Ok(_context.Sessions.Where(s => s.IdClient == clientId).ToList());
    }

    [HttpGet("worker/{workerId}")]
    public IActionResult GetWorkerSessions(int workerId)
    {
        return Ok(_context.Sessions.Where(s => s.IdWorker == workerId).ToList());
    }
}