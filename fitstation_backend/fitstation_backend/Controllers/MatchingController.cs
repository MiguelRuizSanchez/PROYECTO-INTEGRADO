using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using Microsoft.EntityFrameworkCore;
// CAMBIO: Añadidos los usings para la seguridad
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
// FIN DEL CAMBIO

namespace fitstation_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // CAMBIO: Ahora el endpoint exige estar logueado
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
        // CAMBIO - verificamos de forma segura la identidad del usuario logueado
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userId = int.Parse(claimValue);

        var clientProfile = _context.Clients.FirstOrDefault(c => c.IdUser == userId);

        // pregunta - si no tiene perfil de cliente, o si el IdClient de la URL no coincide con el suyo, le denegamos el acceso
        if (clientProfile == null || clientProfile.IdClient != clientId)
            return Forbid();
        // FIN DEL CAMBIO

        // 2. Normalizar objetivos
        string clientObjectives = (clientProfile.Objectives ?? "").ToLower().Trim();

        // evitar devolver TODOS los workers si está vacío
        if (string.IsNullOrEmpty(clientObjectives))
        {
            return Ok(new List<object>());
        }

        // 3. Query optimizada 
        var matches = _context.Workers
            .Join(_context.Users,
                w => w.IdUser,
                u => u.IdUser,
                (w, u) => new { w, u })
            .Where(joined =>
                joined.w.MaxCapacity > 0 &&
                (
                    (joined.w.Specialization != null &&
                     EF.Functions.Like(joined.w.Specialization.ToLower(), $"%{clientObjectives}%")) ||

                    (joined.w.Specialty != null &&
                     EF.Functions.Like(joined.w.Specialty.ToLower(), $"%{clientObjectives}%"))
                )
            )
            .Select(joined => new
            {
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
