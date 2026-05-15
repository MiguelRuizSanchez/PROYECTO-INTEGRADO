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
    [Authorize]
    public class RoutineController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RoutineController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Catálogo global de ejercicios
        [HttpGet("exercises")]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetExercises()
        {
            return Ok(await _context.Exercises.ToListAsync());
        }

        // 2. Biblioteca de rutinas del Coach
        [HttpGet("worker/{workerId}")]
        public async Task<ActionResult<IEnumerable<Routine>>> GetWorkerRoutines(int workerId)
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdStr)) return Unauthorized("No identificado");

                int userId = int.Parse(userIdStr);
                var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == userId);
                if (worker == null) return BadRequest("Perfil de entrenador no encontrado.");

                var routines = await _context.Routines.Where(r => r.IdWorker == worker.IdWorker).ToListAsync();
                return Ok(routines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al cargar biblioteca: {ex.Message}");
            }
        }

        // 3. Obtener el nombre del alumno específico
        [HttpGet("client-name/{clientId}")]
        public async Task<IActionResult> GetClientName(int clientId)
        {
            try
            {
                var nombreAlumno = await _context.Clients
                    .Where(c => c.IdClient == clientId)
                    .Join(_context.Users, 
                        c => c.IdUser, 
                        u => u.IdUser, 
                        (c, u) => u.Name)
                    .FirstOrDefaultAsync();

                return Ok(new { name = nombreAlumno ?? "Alumno" });
            }
            catch
            {
                return Ok(new { name = "Alumno" });
            }
        }

        // 4. Guardar rutina completa en la biblioteca
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

        // 🚀 5. ASIGNACIÓN CORREGIDA: Sin campos fantasma y con mapeo de ID real
        [HttpPost("assign-to-client")]
        public async Task<IActionResult> AssignToClient([FromBody] AssignRoutineDto dto)
        {
            try
            {
                var asignacion = new ClientRoutine
                {
                    IdClient = dto.IdClient,
                    IdRoutine = dto.IdRoutine
                    // ❌ Fecha eliminada por completo
                };

                _context.ClientRoutines.Add(asignacion);
                await _context.SaveChangesAsync();
                return Ok(new { message = "✅ Rutina asignada con éxito" });
            }
            catch (Exception ex)
            {
                var sqlError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Fallo físico en BD: {sqlError}");
            }
        }

        // 🚀 6. LISTADO CORREGIDO: Ordena por la ID autoincremental de la tabla
        [HttpGet("client/{clientId}")]
        public async Task<IActionResult> GetClientRoutines(int clientId)
        {
            try
            {
                var clientRoutines = await _context.ClientRoutines
                    .Where(cr => cr.IdClient == clientId)
                    .OrderByDescending(cr => cr.Id) // Súper truco: el ID más alto siempre es el último asignado
                    .Join(_context.Routines,
                        cr => cr.IdRoutine,
                        r => r.IdRoutine,
                        (cr, r) => new {
                            IdRoutine = r.IdRoutine,
                            Name = r.Name,
                            Description = r.Description
                        })
                    .ToListAsync();

                return Ok(clientRoutines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al recuperar planes: {ex.Message}");
            }
        }

        // 7. Obtener detalles de ejercicios de una rutina
        [HttpGet("{routineId}/details")]
        public async Task<IActionResult> GetRoutineDetails(int routineId)
        {
            try
            {
                var detalles = await _context.RoutineExercises
                    .Where(re => re.IdRoutine == routineId)
                    .Join(_context.Exercises,
                        re => re.IdExercise,
                        e => e.IdExercise,
                        (re, e) => new {
                            ExerciseName = e.Name,
                            Muscle = e.MuscleGroup,
                            Series = re.Sets,
                            Repetitions = re.Reps,
                            Rest = 60
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

    public class AssignRoutineDto {
        public int IdClient { get; set; }
        public int IdRoutine { get; set; }
    }
}