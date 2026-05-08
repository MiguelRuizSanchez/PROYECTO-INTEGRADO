using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using fitstation_backend.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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

    // CREAR UNA RUTINA NUEVA - ENTRENADOR
    [HttpPost("create")]
    [Authorize(Roles = "worker")]
    public IActionResult CreateRoutine([FromBody] CreateRoutineDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var worker = _context.Workers.FirstOrDefault(w => w.IdUser == userId);

        if (worker == null) return Forbid("No tienes perfil de entrenador.");

        var newRoutine = new Routine
        {
            IdWorker = worker.IdWorker,
            Name = dto.Name,
            Description = dto.Description
        };

        _context.Routines.Add(newRoutine);
        _context.SaveChanges();

        return Ok(new { message = "Rutina creada con éxito", routineId = newRoutine.IdRoutine });
    }

    // AÑADIR UN EJERCICIO A UNA RUTINA - ENTRENADOR
    [HttpPost("{routineId}/add-exercise")]
    [Authorize(Roles = "worker")]
    public IActionResult AddExerciseToRoutine(int routineId, [FromBody] AddExerciseDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var worker = _context.Workers.FirstOrDefault(w => w.IdUser == userId);

        // comproba que la rutina exista y pertenezca a este entrenador
        var routine = _context.Routines.FirstOrDefault(r => r.IdRoutine == routineId && r.IdWorker == worker!.IdWorker);
        if (routine == null) return NotFound("Rutina no encontrada o no te pertenece.");

        // comproba que el ejercicio exista en la base de datos
        var exerciseExists = _context.Exercises.Any(e => e.IdExercise == dto.IdExercise);
        if (!exerciseExists) return NotFound("El ejercicio indicado no existe en la base de datos.");

        var routineExercise = new RoutineExercise
        {
            IdRoutine = routineId,
            IdExercise = dto.IdExercise,
            Reps = dto.Reps,
            Sets = dto.Sets
        };

        _context.RoutineExercises.Add(routineExercise);
        _context.SaveChanges();

        return Ok(new { message = "Ejercicio añadido a la rutina correctamente." });
    }

    // OBTENER LAS RUTINAS DEL ENTRENADOR LOGUEADO
    [HttpGet("my-routines")]
    [Authorize(Roles = "worker")]
    public IActionResult GetMyRoutines()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var worker = _context.Workers.FirstOrDefault(w => w.IdUser == userId);

        if (worker == null) return Forbid();

        var routines = _context.Routines
            .Where(r => r.IdWorker == worker.IdWorker)
            .ToList();

        return Ok(routines);
    }

    // OBTENE TODA LA RUTINA 
    [HttpGet("{routineId}")]
    public IActionResult GetRoutineDetails(int routineId)
    {
        var routine = _context.Routines.FirstOrDefault(r => r.IdRoutine == routineId);
        if (routine == null) return NotFound("Rutina no encontrada.");

        var exercises = _context.RoutineExercises
            .Where(re => re.IdRoutine == routineId)
            .Join(_context.Exercises,
                re => re.IdExercise,
                e => e.IdExercise,
                (re, e) => new
                {
                    re.Id,
                    e.IdExercise,
                    ExerciseName = e.Name,
                    e.MuscleGroup,
                    re.Sets,
                    re.Reps
                })
            .ToList();

        return Ok(new
        {
            routine.IdRoutine,
            routine.Name,
            routine.Description,
            Exercises = exercises
        });
    }
}