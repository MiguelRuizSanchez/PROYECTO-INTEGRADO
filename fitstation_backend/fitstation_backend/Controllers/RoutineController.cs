using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
// 🚀 ESTAS LÍNEAS SON LAS QUE ARREGLAN EL ERROR CS0246
using fitstation_backend.Data;   
using fitstation_backend.Models; 

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

        // 1. OBTENER EJERCICIOS (Para el catálogo de Angular)
        [HttpGet("exercises")]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetExercises()
        {
            try
            {
                // Usamos la tabla definida en tu ApplicationDbContext
                var exercises = await _context.Exercises.ToListAsync();
                return Ok(exercises);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al obtener ejercicios: {ex.Message}");
            }
        }

        // 2. CREAR RUTINA COMPLETA (Cabecera + Ejercicios)
        [HttpPost("create-full")]
        public async Task<IActionResult> CreateFullRoutine([FromBody] RoutineCreateDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Obtenemos el ID del Coach desde el Token
                var workerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(workerIdClaim)) return Unauthorized("Usuario no válido");

                // A. Insertamos la Rutina base
                var nuevaRutina = new Routine
                {
                    IdWorker = int.Parse(workerIdClaim),
                    Name = dto.Name,
                    Description = dto.Description,
                    CreatedAt = DateTime.Now
                };
                _context.Routines.Add(nuevaRutina);
                await _context.SaveChangesAsync();

                // B. Insertamos los ejercicios asociados
                foreach (var ex in dto.Exercises)
                {
                    var re = new RoutineExercise
                    {
                        IdRoutine = nuevaRutina.IdRoutine,
                        IdExercise = ex.IdExercise,
                        Sets = ex.Series,       // Mapeado a 'series' en SQL
                        Reps = ex.Repetitions, // Mapeado a 'repetitions' en SQL
                        RestSeconds = ex.Rest  // Mapeado a 'rest_seconds' en SQL
                    };
                    _context.RoutineExercises.Add(re);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Rutina guardada con éxito" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
    }

    // Estructuras de datos para recibir la información desde Angular
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
        public int Rest { get; set; }
    }
}