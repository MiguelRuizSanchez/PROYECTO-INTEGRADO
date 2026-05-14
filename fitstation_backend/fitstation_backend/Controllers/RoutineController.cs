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

        // Obtener ejercicios
        [HttpGet("exercises")]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetExercises()
        {
            return Ok(await _context.Exercises.ToListAsync());
        }

        // GUARDAR RUTINA SIN FECHA (Sincronizado con SQL)
        [HttpPost("create-full")]
        public async Task<IActionResult> CreateFullRoutine([FromBody] RoutineCreateDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var workerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(workerIdStr)) return Unauthorized("No identificado");

                int workerId = int.Parse(workerIdStr);

                // A. Guardar en 'routines' (Solo columnas existentes)
                var nuevaRutina = new Routine
                {
                    IdWorker = workerId,
                    Name = dto.Name,
                    Description = dto.Description
                    // Ya no ponemos CreatedAt aquí
                };

                _context.Routines.Add(nuevaRutina);
                await _context.SaveChangesAsync();

                // B. Guardar en 'routine_exercises'
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

                return Ok(new { message = "✅ ¡Rutina guardada con éxito!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var msg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Error en SQL: {msg}");
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