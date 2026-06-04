using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Data;

namespace fitstation_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SessionController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SessionController(ApplicationDbContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
        return string.IsNullOrEmpty(userIdStr) ? 0 : int.Parse(userIdStr);
    }

    // HISTORIAL DE SESIONES
    [HttpGet("client/{clientId}")]
    public async Task<IActionResult> GetClientSessions(int clientId)
    {
        var sessions = new List<object>();
        try
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"
                    SELECT s.id_session, u.name, s.scheduled_date, s.day_of_week, s.start_time, s.status
                    FROM sessions s
                    JOIN workers w ON s.id_worker = w.id_worker
                    JOIN users u ON w.id_user = u.id_user
                    WHERE s.id_client = @c";
                
                var p = command.CreateParameter(); p.ParameterName = "@c"; p.Value = clientId; command.Parameters.Add(p);
                
                if (command.Connection?.State != ConnectionState.Open) await command.Connection.OpenAsync();
                
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        sessions.Add(new {
                            idSession = reader.IsDBNull(0) ? 0 : reader.GetInt32(0),
                            workerName = reader.IsDBNull(1) ? "Coach" : reader.GetString(1),
                            scheduledDate = reader.IsDBNull(2) ? "" : reader.GetDateTime(2).ToString("yyyy-MM-dd"),
                            dayOfWeek = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            startTime = reader.IsDBNull(4) ? "" : reader.GetFieldValue<TimeSpan>(4).ToString(@"hh\:mm"),
                            status = reader.IsDBNull(5) ? "" : reader.GetString(5)
                        });
                    }
                }
            }
            return Ok(sessions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al cargar sesiones: {ex.Message}");
        }
    }

    // DETALLES DE LA SESIÓN
    [HttpGet("details/{sessionId}")]
    public async Task<IActionResult> GetDetails(int sessionId)
    {
        try
        {
            var result = new Dictionary<string, object>();
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"
                    SELECT s.id_client, s.id_worker, c.modality, w.specialty, u.name
                    FROM sessions s
                    LEFT JOIN clients c ON s.id_client = c.id_client
                    LEFT JOIN workers w ON s.id_worker = w.id_worker
                    LEFT JOIN users u ON (u.id_user = c.id_user OR u.id_user = w.id_user)
                    WHERE s.id_session = @id LIMIT 1";
                
                var p = command.CreateParameter(); p.ParameterName = "@id"; p.Value = sessionId; command.Parameters.Add(p);
                if (command.Connection?.State != ConnectionState.Open) await command.Connection.OpenAsync();
                
                using (var reader = await command.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync()) {
                        result.Add("idClient", reader.IsDBNull(0) ? 0 : reader.GetInt32(0));
                        result.Add("idWorker", reader.IsDBNull(1) ? 0 : reader.GetInt32(1));
                        result.Add("modalidad", reader.IsDBNull(2) ? "Presencial" : reader.GetString(2));
                        result.Add("especialidad", reader.IsDBNull(3) ? "General" : reader.GetString(3));
                        result.Add("nombre", reader.IsDBNull(4) ? "Usuario" : reader.GetString(4));
                        return Ok(result);
                    }
                    return NotFound("Sesión no encontrada");
                }
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error en detalles: {ex.Message}");
        }
    }
    // SESIONES ASIGNADAS A WORKER
    [HttpGet("worker/{workerId}")]
    public async Task<IActionResult> GetWorkerSessions(int workerId)
    {
        var sessions = await _context.Sessions
            .Where(s => s.IdWorker == workerId)
            .Join(_context.Clients, s => s.IdClient, c => c.IdClient, (s, c) => new { s, c })
            .Join(_context.Users, temp => temp.c.IdUser, u => u.IdUser, (temp, u) => new {
                idSession = temp.s.IdSession,
                clientName = u.Name,
                scheduledDate = temp.s.ScheduledDate,
                dayOfWeek = temp.s.DayOfWeek,
                startTime = temp.s.StartTime.ToString(@"hh\:mm"),
                status = temp.s.Status
            }).ToListAsync();
        return Ok(sessions);
    }

    // FINALIZA SESIÓN 
[HttpPut("finish/{sessionId}")]
public async Task<IActionResult> FinishSession(int sessionId)
{
    try
    {
        var session = await _context.Sessions.FindAsync(sessionId);
        if (session == null) return NotFound("Sesión no encontrada");

        session.Status = "Completed";

        var request = await _context.WorkerRequests.FindAsync(session.IdRequest);
        if (request != null)
        {
            request.Status = "Completed"; 
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "✅ Sesión finalizada. Slot liberado correctamente." });
    }
    catch (Exception ex)
    {
        return StatusCode(500, $"Error interno al finalizar la sesión: {ex.Message}");
    }
}
}