using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace fitstation_backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin() => User.FindFirst(ClaimTypes.Role)?.Value == "admin";

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            if (!IsAdmin()) return Forbid();
            var users = await _context.Users.Select(u => new { u.IdUser, u.Name, u.Email, u.Role, u.CreatedAt }).ToListAsync();
            return Ok(users);
        }

        [HttpGet("classes")]
        public async Task<IActionResult> GetClasses()
        {
            if (!IsAdmin()) return Forbid();
            var classes = await _context.Classes.ToListAsync();
            return Ok(classes);
        }

        [HttpGet("sessions")]
        public async Task<IActionResult> GetSessions()
        {
            if (!IsAdmin()) return Forbid();
            var sessions = await _context.Sessions.ToListAsync();
            return Ok(sessions);
        }

        [HttpGet("requests")]
        public async Task<IActionResult> GetRequests()
        {
            if (!IsAdmin()) return Forbid();
            var reqs = await _context.WorkerRequests.ToListAsync();
            return Ok(reqs);
        }

        [HttpGet("routines")]
        public async Task<IActionResult> GetRoutines()
        {
            if (!IsAdmin()) return Forbid();
            var routines = await _context.Routines.ToListAsync();
            return Ok(routines);
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetAllChats()
        {
            if (!IsAdmin()) return Forbid();

            var chatInfo = await _context.ConversationUsers
                .Join(_context.Workers, cu => cu.IdWorker, w => w.IdWorker, (cu, w) => new { cu.IdConversation, cu.IdClient, w.IdUser })
                .Join(_context.Users, temp => temp.IdUser, u => u.IdUser, (temp, wu) => new { temp.IdConversation, temp.IdClient, WorkerName = wu.Name })
                .Join(_context.Clients, temp => temp.IdClient, c => c.IdClient, (temp, c) => new { temp.IdConversation, temp.WorkerName, c.IdUser })
                .Join(_context.Users, temp => temp.IdUser, u => u.IdUser, (temp, cu) => new {
                    IdConversation = temp.IdConversation,
                    Title = $"Entrenador {temp.WorkerName} ↔ Alumno {cu.Name}"
                }).ToListAsync();

            var messages = await _context.Messages
                .Join(_context.Users, m => m.IdSender, u => u.IdUser, (m, u) => new {
                    m.IdConversation,
                    Sender = u.Name,
                    m.Content,
                    m.CreatedAt
                }).OrderBy(m => m.CreatedAt).ToListAsync();

            var result = chatInfo.Select(c => new {
                ChatId = c.IdConversation,
                Title = c.Title,
                Messages = messages.Where(m => m.IdConversation == c.IdConversation).ToList()
            });

            return Ok(result);
        }


        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            if (!IsAdmin()) return Forbid();
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            if (user.Role == "admin") return BadRequest("No puedes borrar al administrador principal.");

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Usuario eliminado con todas sus dependencias." });
        }

        [HttpDelete("classes/{id}")]
        public async Task<IActionResult> DeleteClass(int id)
        {
            if (!IsAdmin()) return Forbid();
            var c = await _context.Classes.FindAsync(id);
            if (c != null) { _context.Classes.Remove(c); await _context.SaveChangesAsync(); }
            return Ok(new { message = "Clase eliminada." });
        }

        [HttpDelete("sessions/{id}")]
        public async Task<IActionResult> DeleteSession(int id)
        {
            if (!IsAdmin()) return Forbid();
            var s = await _context.Sessions.FindAsync(id);
            if (s != null) { _context.Sessions.Remove(s); await _context.SaveChangesAsync(); }
            return Ok(new { message = "Sesión eliminada." });
        }
    }
}