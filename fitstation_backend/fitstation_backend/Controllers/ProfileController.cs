using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using fitstation_backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace fitstation_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProfileController(ApplicationDbContext context)
    {
        _context = context;
    }

    // NUEVO: El endpoint "estrella" para el Frontend
    [HttpGet("me")]
    public IActionResult GetMyProfile()
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userId = int.Parse(claimValue);

        return GetProfileLogic(userId);
    }

    [HttpGet("{userId}")]
    public IActionResult GetProfile(int userId)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (currentUserId != userId.ToString())
        {
            return Forbid();
        }

        return GetProfileLogic(userId);
    }

    // Centralizamos la lógica para no repetir código
    private IActionResult GetProfileLogic(int userId)
    {
        var user = _context.Users.Find(userId);
        if (user == null) return NotFound("Usuario no encontrado");

        if (user.Role == "client")
        {
            var client = _context.Clients.FirstOrDefault(c => c.IdUser == userId);
            return Ok(new
            {
                user.IdUser,
                user.Name,
                user.Email,
                user.Role,
                Details = client
            });
        }
        else
        {
            var worker = _context.Workers.FirstOrDefault(w => w.IdUser == userId);
            return Ok(new
            {
                user.IdUser,
                user.Name,
                user.Email,
                user.Role,
                Details = worker
            });
        }
    }

    [HttpPost("update")]
    public IActionResult UpdateProfile(UpdateProfileDto dto)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (currentUserId != dto.UserId.ToString())
        {
            return Forbid();
        }

        var user = _context.Users.Find(dto.UserId);
        if (user == null) return NotFound("Usuario no encontrado");

        if (user.Role == "client")
        {
            var client = _context.Clients.FirstOrDefault(c => c.IdUser == dto.UserId);
            if (client == null)
            {
                client = new Client { IdUser = dto.UserId };
                _context.Clients.Add(client);
            }
            // Mapeo de datos
            client.Objectives = dto.Objectives;
            client.ExperienceLevel = dto.ExperienceLevel;
            client.Modality = dto.Modality;
            client.MedicalNotes = dto.MedicalNotes;
            client.Equipment = dto.Equipment;
            client.PrefDay = dto.PrefDay;
            client.PrefTime = dto.PrefTime;
        }
        else if (user.Role == "worker")
        {
            var worker = _context.Workers.FirstOrDefault(w => w.IdUser == dto.UserId);
            if (worker == null)
            {
                worker = new Worker { IdUser = dto.UserId };
                _context.Workers.Add(worker);
            }
            worker.Specialization = dto.Specialization;
            worker.Bio = dto.Bio;
            worker.PricePerSession = dto.PricePerSession;
            worker.MaxCapacity = dto.MaxCapacity;
        }

        _context.SaveChanges();
        return Ok(new { message = "Perfil actualizado correctamente" });
    }
}