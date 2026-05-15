using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using fitstation_backend.Data;
using fitstation_backend.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace fitstation_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Requerimos el token de Paco para identificarlo
    public class MatchingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MatchingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Matching/suggested-workers/{clientId}
        [HttpGet("suggested-workers/{clientId}")]
        public async Task<IActionResult> GetSuggestedWorkers(int clientId)
        {
            try
            {
                // 1. Salvavidas: Si el ID llega a 0, recuperamos el perfil de Paco usando su Token
                if (clientId <= 0)
                {
                    var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                                    User.FindFirst("id")?.Value;

                    if (!string.IsNullOrEmpty(userIdStr))
                    {
                        int userId = int.Parse(userIdStr);
                        var clientRecord = await _context.Clients.FirstOrDefaultAsync(c => c.IdUser == userId);
                        if (clientRecord != null)
                        {
                            clientId = clientRecord.IdClient;
                        }
                    }
                }

                // 2. Buscamos la fila de Paco en la tabla 'clients' para saber sus objetivos
                var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdClient == clientId);

                // 3. Creamos la consulta base uniendo 'workers' con 'users' para los nombres
                var query = _context.Workers
                    .Join(_context.Users,
                        w => w.IdUser,
                        u => u.IdUser, 
                        (w, u) => new {
                            WorkerId = w.IdWorker,
                            Name = u.Name,
                            Specialty = w.Specialty,
                            Specialization = w.Specialization,
                            Bio = w.Bio,
                            Price = w.PricePerSession,
                            Capacity = w.MaxCapacity
                        });

                // 🚀 4. FILTRADO INTELIGENTE: Si Paco tiene un objetivo guardado, filtramos el catálogo
                // NOTA: He incluido comprobación para 'Objectives' o 'Goal' según cómo se llame en tu modelo Client.cs
                if (client != null)
                {
                    // Intentamos sacar el texto del objetivo (ej: "Hipertrofia")
                    string? objetivoPaco = client.Objectives ?? client.Goal;

                    if (!string.IsNullOrEmpty(objetivoPaco))
                    {
                        string objetivoMinusc = objetivoPaco.ToLower();
                        
                        // Solo nos quedamos con entrenadores cuya especialidad contenga el objetivo de Paco
                        query = query.Where(w => w.Specialty!.ToLower().Contains(objetivoMinusc) || 
                                                 w.Specialization!.ToLower().Contains(objetivoMinusc));
                    }
                }

                var entrenadoresFiltrados = await query.ToListAsync();
                return Ok(entrenadoresFiltrados);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error en el motor de emparejamiento: {ex.Message}");
            }
        }
    }
}