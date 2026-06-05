using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace fitstation_backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChatController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            try
            {
                var myId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var me = await _context.Users.FindAsync(myId);
                if (me == null) return NotFound();
                var userRole = me.Role;

                var existingContactUserIds = new List<int>();
                var autoDiscoveredUserIds = new List<int>();
                var convMap = new Dictionary<int, int>();

                if (userRole == "client")
                {
                    var client = await _context.Clients.FirstOrDefaultAsync(c => c.IdUser == myId);
                    if (client == null) return Ok(new List<object>());

                    var existing = await _context.ConversationUsers
                        .Where(cu => cu.IdClient == client.IdClient)
                        .Join(_context.Workers, cu => cu.IdWorker, w => w.IdWorker, (cu, w) => new { w.IdUser, cu.IdConversation })
                        .ToListAsync();

                    foreach (var item in existing)
                    {
                        existingContactUserIds.Add(item.IdUser);
                        convMap[item.IdUser] = item.IdConversation;
                    }

                    var sessionWorkerIds = await _context.Sessions.Where(s => s.IdClient == client.IdClient).Select(s => s.IdWorker).ToListAsync();
                    var classWorkerIds = await _context.Bookings.Where(b => b.IdClient == client.IdClient && b.Status == "active")
                        .Join(_context.Classes, b => b.IdClass, c => c.IdClass, (b, c) => c.IdWorker).Where(w => w.HasValue).Select(w => w.Value).ToListAsync();

                    var allWorkers = sessionWorkerIds.Concat(classWorkerIds).Distinct().ToList();
                    if (allWorkers.Any())
                    {
                        autoDiscoveredUserIds = await _context.Workers.Where(w => allWorkers.Contains(w.IdWorker)).Select(w => w.IdUser).ToListAsync();
                    }
                }
                else if (userRole == "worker")
                {
                    var worker = await _context.Workers.FirstOrDefaultAsync(w => w.IdUser == myId);
                    if (worker == null) return Ok(new List<object>());

                    var existing = await _context.ConversationUsers
                        .Where(cu => cu.IdWorker == worker.IdWorker)
                        .Join(_context.Clients, cu => cu.IdClient, c => c.IdClient, (cu, c) => new { c.IdUser, cu.IdConversation })
                        .ToListAsync();

                    foreach (var item in existing)
                    {
                        existingContactUserIds.Add(item.IdUser);
                        convMap[item.IdUser] = item.IdConversation;
                    }

                    var sessionClientIds = await _context.Sessions.Where(s => s.IdWorker == worker.IdWorker).Select(s => s.IdClient).ToListAsync();
                    var workerClassIds = await _context.Classes.Where(c => c.IdWorker == worker.IdWorker).Select(c => c.IdClass).ToListAsync();
                    var classClientIds = new List<int>();
                    if (workerClassIds.Any())
                    {
                        classClientIds = await _context.Bookings.Where(b => workerClassIds.Contains(b.IdClass) && b.Status == "active").Select(b => b.IdClient).ToListAsync();
                    }

                    var allClients = sessionClientIds.Concat(classClientIds).Distinct().ToList();
                    if (allClients.Any())
                    {
                        autoDiscoveredUserIds = await _context.Clients.Where(c => allClients.Contains(c.IdClient)).Select(c => c.IdUser).ToListAsync();
                    }
                }

                var finalUserIds = existingContactUserIds.Concat(autoDiscoveredUserIds).Distinct().ToList();
                var result = new List<object>();

                if (finalUserIds.Any())
                {
                    var usersDic = await _context.Users.Where(u => finalUserIds.Contains(u.IdUser)).ToDictionaryAsync(u => u.IdUser, u => u.Name ?? "Usuario");

                    foreach (var targetId in finalUserIds)
                    {
                        result.Add(new
                        {
                            idConversation = convMap.ContainsKey(targetId) ? convMap[targetId] : 0,
                            otherUserId = targetId,
                            otherUserName = usersDic.ContainsKey(targetId) ? usersDic[targetId] : "Usuario"
                        });
                    }
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor.", errorDetail = ex.Message });
            }
        }

        [HttpGet("history/{receiverId}")]
        public async Task<IActionResult> GetHistory(int receiverId)
        {
            var myRole = User.FindFirst(ClaimTypes.Role)?.Value;
            int myId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (myId == 0) return Unauthorized();

            int workerId = 0, clientId = 0;

            if (myRole == "worker")
            {
                workerId = await _context.Workers.Where(w => w.IdUser == myId).Select(w => w.IdWorker).FirstOrDefaultAsync();
                clientId = await _context.Clients.Where(c => c.IdUser == receiverId).Select(c => c.IdClient).FirstOrDefaultAsync();
            }
            else
            {
                clientId = await _context.Clients.Where(c => c.IdUser == myId).Select(c => c.IdClient).FirstOrDefaultAsync();
                workerId = await _context.Workers.Where(w => w.IdUser == receiverId).Select(w => w.IdWorker).FirstOrDefaultAsync();
            }

            var conversationId = await _context.ConversationUsers
                .Where(cu => cu.IdWorker == workerId && cu.IdClient == clientId)
                .Select(cu => cu.IdConversation)
                .FirstOrDefaultAsync();

            if (conversationId == 0) return Ok(new List<object>());

            var messages = await _context.Messages
                .Where(m => m.IdConversation == conversationId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new {
                    idMessage = m.IdMessage,
                    idConversation = m.IdConversation,
                    idSender = m.IdSender,
                    content = m.Content,
                    createdAt = m.CreatedAt
                }).ToListAsync();

            return Ok(messages);
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] ChatSendMessageDto dto)
        {
            var myId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var myRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (myId == 0) return Unauthorized();

            int conversationId = dto.IdConversation;

            if (conversationId == 0)
            {
                int workerId = 0, clientId = 0;

                if (myRole == "worker")
                {
                    workerId = await _context.Workers.Where(w => w.IdUser == myId).Select(w => w.IdWorker).FirstOrDefaultAsync();
                    clientId = await _context.Clients.Where(c => c.IdUser == dto.ReceiverId).Select(c => c.IdClient).FirstOrDefaultAsync();
                }
                else
                {
                    clientId = await _context.Clients.Where(c => c.IdUser == myId).Select(c => c.IdClient).FirstOrDefaultAsync();
                    workerId = await _context.Workers.Where(w => w.IdUser == dto.ReceiverId).Select(w => w.IdWorker).FirstOrDefaultAsync();
                }

                conversationId = await _context.ConversationUsers
                    .Where(cu => cu.IdWorker == workerId && cu.IdClient == clientId)
                    .Select(cu => cu.IdConversation)
                    .FirstOrDefaultAsync();

                if (conversationId == 0)
                {
                    var newConv = new Conversation { CreatedAt = DateTime.Now };
                    _context.Conversations.Add(newConv);
                    await _context.SaveChangesAsync();

                    conversationId = newConv.IdConversation;

                    _context.ConversationUsers.Add(new ConversationUser
                    {
                        IdConversation = conversationId,
                        IdWorker = workerId,
                        IdClient = clientId
                    });
                    await _context.SaveChangesAsync();
                }
            }

            var msg = new Message
            {
                IdConversation = conversationId,
                IdSender = myId,
                Content = dto.Content,
                CreatedAt = DateTime.Now
            };

            _context.Messages.Add(msg);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                idMessage = msg.IdMessage,
                idConversation = msg.IdConversation,
                idSender = msg.IdSender,
                content = msg.Content,
                createdAt = msg.CreatedAt
            });
        }
    }

    public class ChatSendMessageDto
    {
        public int IdConversation { get; set; }
        public int ReceiverId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}