using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using fitstation_backend.Data;
using fitstation_backend.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using System.Threading.Tasks;

namespace fitstation_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MatchingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MatchingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Matching/suggested-workers
        // Ahora es universal: no necesita el clientId por URL, lo extrae del Token.
        [HttpGet("suggested-workers")]
        public async Task<IActionResult> GetSuggestedWorkers()
        {
            try
            {
                // 1. Identificar al usuario real desde el token
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("No identificado.");

                int userId = int.Parse(userIdStr);
                
                // 2. Obtener el cliente real asociado a este usuario
                var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdUser == userId);
                if (client == null) return BadRequest("Perfil de cliente no encontrado. Completa tu perfil.");

                // 3. Consulta base: Unir Workers con Users para obtener nombres y datos
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

                // 4. Filtrado Inteligente Universal: 
                // Usamos los objetivos reales que el cliente guardó en su perfil
                string? objetivoCliente = client.Objectives ?? client.Goal;

                if (!string.IsNullOrEmpty(objetivoCliente))
                {
                    string objetivoMinusc = objetivoCliente.ToLower();
                    
                    // Filtramos entrenadores que coincidan con la especialidad o especialización
                    query = query.Where(w => 
                        (w.Specialty != null && w.Specialty.ToLower().Contains(objetivoMinusc)) || 
                        (w.Specialization != null && w.Specialization.ToLower().Contains(objetivoMinusc))
                    );
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