using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using Microsoft.AspNetCore.Authorization;

namespace fitstation_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExerciseController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ExerciseController(ApplicationDbContext context)
    {
        _context = context;
    }

    // LISTA DE EJERCICIOS ORDENADOS
    [HttpGet]
    public IActionResult GetAllExercises()
    {
        var exercises = _context.Exercises
            .OrderBy(e => e.MuscleGroup) 
            .ThenBy(e => e.Name)
            .ToList();

        return Ok(exercises);
    }

    // BUSCAR EJERCICIOS POR GRUPO MUSCULAR
    [HttpGet("muscle/{muscleGroup}")]
    public IActionResult GetExercisesByMuscleGroup(string muscleGroup)
    {
        var exercises = _context.Exercises
            .Where(e => e.MuscleGroup != null && e.MuscleGroup.ToLower() == muscleGroup.ToLower())
            .ToList();

        return Ok(exercises);
    }
}