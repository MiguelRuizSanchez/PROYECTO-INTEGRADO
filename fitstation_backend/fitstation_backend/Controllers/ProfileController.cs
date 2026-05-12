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

    [HttpGet("me")]
    public IActionResult GetMyProfile()
    {
        // Extraemos el ID del Token
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userId = int.Parse(claimValue);

        var user = _context.Users.Find(userId);
        if (user == null) return NotFound();

        object? details = null;
        if (user.Role.ToLower() == "client")
            details = _context.Clients.FirstOrDefault(c => c.IdUser == userId);
        else if (user.Role.ToLower() == "worker")
            details = _context.Workers.FirstOrDefault(w => w.IdUser == userId);

        return Ok(new { name = user.Name, role = user.Role, details });
    }

    [HttpPost("update")]
    public IActionResult UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        // Identidad segura desde el Token JWT
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var userIdFromToken = int.Parse(claimValue);

        var user = _context.Users.Find(userIdFromToken);
        if (user == null) return NotFound("Usuario no existe");

        try 
        {
            if (user.Role.ToLower() == "client")
            {
                var client = _context.Clients.FirstOrDefault(c => c.IdUser == userIdFromToken);
                if (client == null) {
                    client = new Client { IdUser = userIdFromToken };
                    _context.Clients.Add(client);
                }

                client.Goal = dto.Objectives;
                client.Objectives = dto.Objectives;
                client.ExperienceLevel = dto.ExperienceLevel;
                client.Modality = dto.Modality;
                client.MedicalNotes = dto.MedicalNotes;
                client.Equipment = dto.Equipment;
                client.PrefDay = dto.PrefDay;

                // Convertimos el string de la hora a TimeSpan para MySQL
                if (TimeSpan.TryParse(dto.PrefTime, out var t)) {
                    client.PrefTime = t;
                }
            }
            else if (user.Role.ToLower() == "worker")
            {
                var worker = _context.Workers.FirstOrDefault(w => w.IdUser == userIdFromToken);
                if (worker == null) {
                    worker = new Worker { IdUser = userIdFromToken };
                    _context.Workers.Add(worker);
                }

                worker.Specialization = dto.Specialization;
                worker.Specialty = dto.Specialization;
                worker.Bio = dto.Bio;
                worker.PricePerSession = dto.PricePerSession ?? 0;
                worker.MaxCapacity = dto.MaxCapacity ?? 10;
            }

            _context.SaveChanges();
            return Ok(new { message = "¡Perfil guardado con éxito!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                error = "Error al guardar en base de datos", 
                detalle = ex.InnerException?.Message ?? ex.Message 
            });
        }
    }
}