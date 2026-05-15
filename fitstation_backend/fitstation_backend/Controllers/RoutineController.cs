using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using fitstation_backend.Data;
using fitstation_backend.Models;
using System.Security.Claims;

namespace fitstation_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoutineController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RoutineController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Catálogo de Ejercicios para Angular
        [HttpGet("exercises")]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetExercises()
        {
            return Ok(await _context.Exercises.ToListAsync());
        }

        // 2. Biblioteca de Rutinas del Coach logueado
        [HttpGet("worker-library")]
        public async Task<ActionResult<IEnumerable<Routine>>> GetWorkerRoutines()
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("No identificado");

                int userId = int.Parse(userIdStr);

                // Buscamos cuál es su id_worker real en la base de datos
                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId);
                if (worker == null) return BadRequest("No eres un entrenador registrado.");

                var routines = await _context.Routines
                    .Where(r => r.IdWorker == worker.IdWorker)
                    .ToListAsync();

                return Ok(routines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al cargar biblioteca: {ex.Message}");
            }
        }

        // 3. Guardar Rutina Completa (Cabecera + Ejercicios)
        [HttpPost("create-full")]
        public async Task<IActionResult> CreateFullRoutine([FromBody] RoutineCreateDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Extraemos el ID de usuario desde el Token JWT
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("Token de usuario inválido");

                int userId = int.Parse(userIdStr);

                // Traducimos el id_user al id_worker real de la base de datos
                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId);
                if (worker == null) 
                {
                    return BadRequest("La cuenta conectada no tiene un perfil de Worker asociado.");
                }

                // A. Insertamos en 'routines' usando el id_worker correcto
                var nuevaRutina = new Routine
                {
                    IdWorker = worker.IdWorker,
                    Name = dto.Name,
                    Description = dto.Description
                };

                _context.Routines.Add(nuevaRutina);
                await _context.SaveChangesAsync();

                // B. Insertamos los ejercicios en 'routine_exercises'
                foreach (var exDto in dto.Exercises)
                {
                    if (exDto.IdExercise <= 0) continue;

                    var re = new RoutineExercise
                    {
                        IdRoutine = nuevaRutina.IdRoutine,
                        IdExercise = exDto.IdExercise,
                        Reps = exDto.Repetitions,
                        Sets = exDto.Series
                    };
                    _context.RoutineExercises.Add(re);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "✅ ¡Rutina guardada en tu biblioteca con éxito!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var detalle = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Error de persistencia: {detalle}");
            }
        }
    }

    // Estructuras de comunicación (DTOs)
    public class RoutineCreateDto 
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<ExerciseDto> Exercises { get; set; } = new();
    }

    public class ExerciseDto 
    {
        public int IdExercise { get; set; }
        public int Series { get; set; }
        public int Repetitions { get; set; }
    }
}