using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace fitstation_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RoutineController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RoutineController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("worker/{workerId}")]
    public async Task<ActionResult<IEnumerable<Routine>>> GetWorkerRoutines(int workerId)
    {
        return await _context.Routines
            .Where(r => r.IdWorker == workerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    // 🚀 NUEVO: Obtener las rutinas asignadas a un cliente específico
    [HttpGet("client/{clientId}")]
    public async Task<IActionResult> GetClientRoutines(int clientId)
    {
        var routines = await (from cr in _context.ClientRoutines
                              join r in _context.Routines on cr.IdRoutine equals r.IdRoutine
                              where cr.IdClient == clientId
                              select new {
                                  r.IdRoutine,
                                  r.Name,
                                  r.Description,
                                  r.CreatedAt
                              }).ToListAsync();
        return Ok(routines);
    }

    [HttpPost]
    public async Task<ActionResult<Routine>> CreateRoutine([FromBody] Routine routine)
    {
        _context.Routines.Add(routine);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetWorkerRoutines), new { workerId = routine.IdWorker }, routine);
    }

    [HttpPost("add-exercise")]
    public async Task<IActionResult> AddExerciseToRoutine([FromBody] RoutineExercise re)
    {
        _context.RoutineExercises.Add(re);
        await _context.SaveChangesAsync();
        return Ok(re);
    }

    [HttpGet("{routineId}/details")]
    public async Task<IActionResult> GetRoutineDetails(int routineId)
    {
        var exercises = await (from re in _context.RoutineExercises
                              join e in _context.Exercises on re.IdExercise equals e.IdExercise
                              where re.IdRoutine == routineId
                              select new {
                                  re.Id, 
                                  exerciseName = e.Name,
                                  series = re.Sets,
                                  repetitions = re.Reps,
                                  rest = re.RestSeconds,
                                  muscle = e.MuscleGroup
                              }).ToListAsync();

        return Ok(exercises);
    }

    [HttpDelete("exercise/{id}")]
    public async Task<IActionResult> RemoveExerciseFromRoutine(int id)
    {
        var re = await _context.RoutineExercises.FindAsync(id);
        if (re == null) return NotFound();

        _context.RoutineExercises.Remove(re);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("assign-to-client")]
    public IActionResult AssignToClient([FromBody] AssignRoutineDto dto)
    {
        var exists = _context.ClientRoutines.Any(cr => cr.IdClient == dto.IdClient && cr.IdRoutine == dto.IdRoutine);
        if (exists) return BadRequest(new { message = "Esta rutina ya ha sido enviada a este cliente." });

        var relation = new ClientRoutine
        {
            IdClient = dto.IdClient,
            IdRoutine = dto.IdRoutine
        };

        _context.ClientRoutines.Add(relation);
        _context.SaveChanges();

        return Ok(new { message = "¡Rutina enviada con éxito al cliente!" });
    }
}

public class AssignRoutineDto 
{
    public int IdClient { get; set; }
    public int IdRoutine { get; set; }
}