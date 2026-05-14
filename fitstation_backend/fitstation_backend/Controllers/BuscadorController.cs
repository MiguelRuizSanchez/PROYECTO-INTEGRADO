using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace fitstation_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BuscadorController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BuscadorController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("check-availability/{clientId}/{workerId}")]
    public IActionResult CheckAvailability(int clientId, int workerId)
    {
        var activeSession = _context.Sessions
            .Any(s => s.IdClient == clientId && s.IdWorker == workerId && s.Status != "Completed");

        var pendingRequest = _context.WorkerRequests
            .Any(r => r.IdClient == clientId && r.IdWorker == workerId && r.Status == "Pending");

        if (activeSession || pendingRequest)
        {
            return Ok(new { available = false, message = "Ya tienes una gestión activa o pendiente con este entrenador." });
        }

        return Ok(new { available = true });
    }
}