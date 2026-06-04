using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

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
        // OBTIENE CONVERSACIONES Y PERSONA CON LA QUE HABLA
        [HttpGet("conversations")]
        public IActionResult GetConversations()
        {
            var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(nameIdentifier)) return Unauthorized();

            var myId = int.Parse(nameIdentifier);

            var myConversationIds = _context.ConversationUsers
                .Where(cu => cu.IdUser == myId)
                .Select(cu => cu.IdConversation)
                .ToList();

            var result = _context.ConversationUsers
                .Where(cu => myConversationIds.Contains(cu.IdConversation) && cu.IdUser != myId)
                .Select(cu => new
                {
                    IdConversation = cu.IdConversation,
                    OtherUserId = cu.IdUser,
                    OtherUserName = _context.Users
                        .Where(u => u.IdUser == cu.IdUser)
                        .Select(u => u.Name)
                        .FirstOrDefault() ?? "Usuario"
                })
                .ToList();

            return Ok(result);
        }
        // RECUPERA MENSAJES ANTERIORES
        [HttpGet("messages/{idConversation}")]
        public IActionResult GetMessages(int idConversation)
        {
            var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(nameIdentifier)) return Unauthorized();

            var myId = int.Parse(nameIdentifier);

            var isParticipant = _context.ConversationUsers
                .Any(cu => cu.IdConversation == idConversation && cu.IdUser == myId);

            if (!isParticipant) return Forbid();

            var messages = _context.Messages
                .Where(m => m.IdConversation == idConversation)
                .OrderBy(m => m.CreatedAt)
                .ToList();

            return Ok(messages);
        }
        // ENVÍA UN MENSAJE, CREANDO NUEVA CONVERSACIÓN SI NO HABIA ANTES
        [HttpPost("send")]
        public IActionResult SendMessage([FromBody] ChatSendMessageDto dto)
        {
            try
            {
                var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(nameIdentifier)) return Unauthorized();

                var myId = int.Parse(nameIdentifier);
                int conversationId = dto.IdConversation;

                if (conversationId == 0 && dto.ReceiverId > 0)
                {
                    conversationId = _context.ConversationUsers
                        .Where(cu => cu.IdUser == myId)
                        .Select(cu => cu.IdConversation)
                        .Intersect(_context.ConversationUsers
                            .Where(cu => cu.IdUser == dto.ReceiverId)
                            .Select(cu => cu.IdConversation))
                        .FirstOrDefault();
                }

                if (conversationId == 0)
                {
                    var newConv = new Conversation { CreatedAt = DateTime.Now };
                    _context.Conversations.Add(newConv);
                    _context.SaveChanges();
                    conversationId = newConv.IdConversation;

                    _context.ConversationUsers.Add(new ConversationUser { IdConversation = conversationId, IdUser = myId });
                    _context.ConversationUsers.Add(new ConversationUser { IdConversation = conversationId, IdUser = dto.ReceiverId });
                    _context.SaveChanges();
                }

                var msg = new Message
                {
                    IdConversation = conversationId,
                    IdSender = myId,
                    Content = dto.Content,
                    CreatedAt = DateTime.Now
                };

                _context.Messages.Add(msg);
                _context.SaveChanges();

                return Ok(msg);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error DB: {ex.Message}");
            }
        }
    }

    public class ChatSendMessageDto
    {
        public int IdConversation { get; set; }
        public int ReceiverId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}