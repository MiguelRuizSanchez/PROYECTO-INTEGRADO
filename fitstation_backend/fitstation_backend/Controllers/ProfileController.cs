using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Linq;

namespace fitstation_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProfileController(ApplicationDbContext context) => _context = context;

    private int GetCurrentUserId()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
        return string.IsNullOrEmpty(userIdStr) ? 0 : int.Parse(userIdStr);
    }

    // ==========================================
    // 1. GET MY PROFILE
    // ==========================================
    [HttpGet("my-profile")]
    public async Task<IActionResult> GetMyProfile()
    {
        try
        {
            int userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized("Token no encontrado");

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("Usuario no encontrado");

            var profile = new Dictionary<string, object> {
                { "name", user.Name ?? "" }, { "email", user.Email ?? "" }, { "role", user.Role ?? "" }
            };

            if (user.Role == "worker")
            {
                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId);
                profile["details"] = new { idWorker = worker?.IdWorker ?? 0, specialization = worker?.Specialization ?? worker?.Specialty ?? "", bio = worker?.Bio ?? "", pricePerSession = worker?.PricePerSession ?? 0 };
            }
            else
            {
                var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdUser == userId);
                profile["details"] = new { idClient = client?.IdClient ?? 0, objectives = client?.Objectives ?? "", goal = client?.Goal ?? "", prefDay = client?.PrefDay ?? "Monday" };
            }
            return Ok(profile);
        }
        catch (Exception ex) { return StatusCode(500, $"Error al cargar perfil: {ex.Message}"); }
    }

    // ==========================================
    // 2. UPDATE PROFILE
    // ==========================================
    [HttpPut("update")]
    public async Task<IActionResult> UpdateProfile([FromBody] JsonElement json)
    {
        int userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("Usuario no encontrado");

        if (user.Role == "worker")
        {
            var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId) ?? new Worker { IdUser = userId };
            if (worker.IdWorker == 0) _context.Workers.Add(worker);
            
            if (json.TryGetProperty("specialization", out var s) || json.TryGetProperty("Specialization", out s)) {
                string val = s.GetString() ?? ""; worker.Specialization = val; worker.Specialty = val; 
            }
            if (json.TryGetProperty("bio", out var b) || json.TryGetProperty("Bio", out b)) worker.Bio = b.GetString();
        }
        else
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdUser == userId) ?? new Client { IdUser = userId };
            if (client.IdClient == 0) _context.Clients.Add(client);
            
            if (json.TryGetProperty("objectives", out var o) || json.TryGetProperty("Objectives", out o)) client.Objectives = o.GetString();
            if (json.TryGetProperty("goal", out var g) || json.TryGetProperty("Goal", out g)) client.Goal = g.GetString();
        }
        await _context.SaveChangesAsync();
        return Ok(new { message = "Perfil actualizado" });
    }

    // ==========================================
    // 3. BUSCADOR FILTRADO (LINQ JOINs SIN INCLUDE)
    // ==========================================
    [HttpGet("suggested-workers/{clientId}")]
    public async Task<IActionResult> GetSuggestedWorkers(int clientId)
    {
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdClient == clientId);
        string filtro = client?.Objectives ?? client?.Goal ?? "";

        // Usamos Join explícito para no depender de relaciones en el modelo
        var workers = await _context.Workers
            .Join(_context.Users, w => w.IdUser, u => u.IdUser, (w, u) => new { w, u })
            .Where(x => string.IsNullOrEmpty(filtro) || x.w.Specialization == filtro || x.w.Specialty == filtro)
            .Select(x => new {
                x.w.IdWorker, Name = x.u.Name, x.w.Specialization, x.w.Bio, x.w.PricePerSession
            }).ToListAsync();

        return Ok(workers);
    }

    // ==========================================
    // 4. GESTIÓN DE CITAS (JOINs MANUALES PARA EVITAR CS1061)
    // ==========================================
    [HttpPost("request-coach")]
    public async Task<IActionResult> RequestCoach([FromBody] JsonElement json)
    {
        int userId = GetCurrentUserId();
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdUser == userId);
        if (client == null) return NotFound("Cliente no registrado");

        int idWorker = json.TryGetProperty("idWorker", out var w) ? w.GetInt32() : 0;
        
        var request = new WorkerRequest {
            IdClient = client.IdClient,
            IdWorker = idWorker,
            Status = "Pending",
            RequestDate = DateTime.Now
        };

        _context.WorkerRequests.Add(request);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Solicitud enviada" });
    }

    [HttpGet("worker-requests/{idWorker}")]
    public async Task<IActionResult> GetWorkerRequests(int idWorker)
    {
        // JOIN manual para obtener nombre del cliente
        var reqs = await _context.WorkerRequests
            .Where(r => r.IdWorker == idWorker && r.Status == "Pending")
            .Join(_context.Clients, r => r.IdClient, c => c.IdClient, (r, c) => new { r, c })
            .Join(_context.Users, temp => temp.c.IdUser, u => u.IdUser, (temp, u) => new { temp.r, u.Name })
            .Select(x => new { 
                x.r.IdRequest, ClientName = x.Name, x.r.Status, Date = x.r.RequestDate 
            })
            .ToListAsync();
        return Ok(reqs);
    }

    [HttpGet("client-requests/{idClient}")]
    public async Task<IActionResult> GetClientRequests(int idClient)
    {
        // JOIN manual para obtener nombre del trabajador
        var reqs = await _context.WorkerRequests
            .Where(r => r.IdClient == idClient)
            .Join(_context.Workers, r => r.IdWorker, w => w.IdWorker, (r, w) => new { r, w })
            .Join(_context.Users, temp => temp.w.IdUser, u => u.IdUser, (temp, u) => new { temp.r, u.Name })
            .Select(x => new { 
                x.r.IdRequest, WorkerName = x.Name, x.r.Status 
            })
            .ToListAsync();
        return Ok(reqs);
    }
    
    [HttpPut("update-status/{requestId}")]
    public async Task<IActionResult> UpdateStatus(int requestId, [FromBody] JsonElement json)
    {
        var request = await _context.WorkerRequests.FindAsync(requestId);
        if (request == null) return NotFound();
        request.Status = json.TryGetProperty("status", out var s) ? s.GetString() : "Accepted";
        await _context.SaveChangesAsync();
        return Ok(new { message = "Status actualizado" });
    }

    [HttpGet("occupied-slots/{workerId}")]
    public async Task<IActionResult> GetOccupiedSlots(int workerId, [FromQuery] string date)
    {
        try 
        {
            var dateValue = DateTime.Parse(date).Date;
            var occupiedTimes = await _context.Sessions
                .Where(s => s.IdWorker == workerId && s.ScheduledDate != null && 
                            s.ScheduledDate.Value.Date == dateValue && s.Status != "Completed")
                .Select(s => s.StartTime.ToString(@"hh\:mm"))
                .ToListAsync();
                
            return Ok(occupiedTimes);
        }
        catch
        {
            return Ok(new List<string>());
        }
    }
}

