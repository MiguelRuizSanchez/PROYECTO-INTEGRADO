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

        // 1. Catálogo global de ejercicios (Lo que usamos en el desplegable)
        [HttpGet("exercises")]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetExercises()
        {
            return Ok(await _context.Exercises.ToListAsync());
        }

        // 2. Biblioteca de rutinas del Coach logueado
        [HttpGet("worker-library")]
        public async Task<ActionResult<IEnumerable<Routine>>> GetWorkerRoutines()
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("No identificado");

                int userId = int.Parse(userIdStr);
                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId);
                if (worker == null) return BadRequest("No eres un entrenador registrado.");

                var routines = await _context.Routines.Where(r => r.IdWorker == worker.IdWorker).ToListAsync();
                return Ok(routines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al cargar biblioteca: {ex.Message}");
            }
        }

        // 3. Guardar rutina completa en la biblioteca (¡El que probaste con éxito!)
        [HttpPost("create-full")]
        public async Task<IActionResult> CreateFullRoutine([FromBody] RoutineCreateDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("Token inválido");

                int userId = int.Parse(userIdStr);
                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId);
                if (worker == null) return BadRequest("Perfil de Worker no asociado.");

                var nuevaRutina = new Routine { IdWorker = worker.IdWorker, Name = dto.Name, Description = dto.Description };
                _context.Routines.Add(nuevaRutina);
                await _context.SaveChangesAsync();

                foreach (var exDto in dto.Exercises)
                {
                    if (exDto.IdExercise <= 0) continue;
                    _context.RoutineExercises.Add(new RoutineExercise {
                        IdRoutine = nuevaRutina.IdRoutine,
                        IdExercise = exDto.IdExercise,
                        Reps = exDto.Repetitions,
                        Sets = exDto.Series
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "✅ ¡Rutina guardada!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // 🚀 4. ENLACE CON TU FRONTEND: Obtener rutinas asignadas al alumno
        // Responde directamente a: getClientRoutines(clientId) de tu profile.service.ts
        [HttpGet("client/{clientId}")]
        public async Task<IActionResult> GetClientRoutines(int clientId)
        {
            try
            {
                // Buscamos en client_routines y cruzamos con la tabla routines para sacar los nombres
                var clientRoutines = await _context.ClientRoutines
                    .Where(cr => cr.IdClient == clientId)
                    .Join(_context.Routines,
                        cr => cr.IdRoutine,
                        r => r.IdRoutine,
                        (cr, r) => new {
                            IdRoutine = r.IdRoutine,
                            Name = r.Name,
                            Description = r.Description,
                            AssignedAt = cr.AssignedAt
                        })
                    .OrderByDescending(x => x.AssignedAt)
                    .ToListAsync();

                return Ok(clientRoutines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al recuperar planes: {ex.Message}");
            }
        }

        // 🚀 5. ENLACE CON TU FRONTEND: Obtener los ejercicios de la rutina seleccionada
        // Responde directamente a: getRoutineDetails(routineId) de tu profile.service.ts
        [HttpGet("{routineId}/details")]
        public async Task<IActionResult> GetRoutineDetails(int routineId)
        {
            try
            {
                // Cruzamos routine_exercises con exercises para armar el objeto que tu HTML renderiza
                var detalles = await _context.RoutineExercises
                    .Where(re => re.IdRoutine == routineId)
                    .Join(_context.Exercises,
                        re => re.IdExercise,
                        e => e.IdExercise,
                        (re, e) => new {
                            ExerciseName = e.Name,
                            Muscle = e.MuscleGroup,
                            Series = re.Sets,       // Coincide con {{ ej.series }} de tu HTML
                            Repetitions = re.Reps,  // Coincide con {{ ej.repetitions }} de tu HTML
                            Rest = 60               // Tu tabla SQL no tiene columna 'rest', enviamos un valor por defecto seguro
                        })
                    .ToListAsync();

                return Ok(detalles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al recuperar ejercicios: {ex.Message}");
            }
        }
    }

    public class RoutineCreateDto {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<ExerciseDto> Exercises { get; set; } = new();
    }

    public class ExerciseDto {
        public int IdExercise { get; set; }
        public int Series { get; set; }
        public int Repetitions { get; set; }
    }
}