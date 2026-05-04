using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace fitstation_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchingController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MatchingController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("suggested-workers/{clientId}")]
    public IActionResult GetMatches(int clientId)
    {
        // 1. Buscamos al cliente y sus datos de perfil
        var clientProfile = _context.Clients.FirstOrDefault(c => c.IdUser == clientId);
        if (clientProfile == null) return NotFound("Perfil de cliente no encontrado");

        // Convertimos el objetivo a minúsculas y quitamos espacios para que la búsqueda no sea estricta
        string clientObjectives = (clientProfile.Objectives ?? "").ToLower().Trim();

        // 2. Buscamos trabajadores con capacidad y que encajen
        var matches = _context.Workers
            .Join(_context.Users,
                w => w.IdUser,
                u => u.IdUser,
                (w, u) => new { w, u })
            .Where(joined => joined.w.MaxCapacity > 0)
            .ToList() // Pasamos a memoria para poder usar ToLower() y Contains() sin fallos de SQL
            .Where(joined =>
                (joined.w.Specialization ?? "").ToLower().Contains(clientObjectives) ||
                (joined.w.Specialty ?? "").ToLower().Contains(clientObjectives))
            .Select(joined => new {
                WorkerId = joined.w.IdWorker,
                Name = joined.u.Name,
                Specialty = joined.w.Specialty,
                Bio = joined.w.Bio,
                Price = joined.w.PricePerSession
            })
            .ToList();

        return Ok(matches);
    }
}