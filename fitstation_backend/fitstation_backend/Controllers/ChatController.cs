using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace fitstation_backend.Controllers;

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

    [HttpGet("history/{otherUserId}")]
    public IActionResult GetHistory(int otherUserId)
    {
        var myId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        var conversationId = _context.ConversationUsers
            .Where(cu => cu.IdUser == myId)
            .Select(cu => cu.IdConversation)
            .Intersect(_context.ConversationUsers
                .Where(cu => cu.IdUser == otherUserId)
                .Select(cu => cu.IdConversation))
            .FirstOrDefault();

        if (conversationId == 0) return Ok(new List<Message>());

        var messages = _context.Messages
            .Where(m => m.IdConversation == conversationId)
            .OrderBy(m => m.CreatedAt)
            .ToList();

        return Ok(messages);
    }

    [HttpPost("send")]
    public IActionResult SendMessage([FromBody] MessageDto dto)
    {
        try {
            var myId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

            var conversationId = _context.ConversationUsers
                .Where(cu => cu.IdUser == myId)
                .Select(cu => cu.IdConversation)
                .Intersect(_context.ConversationUsers
                    .Where(cu => cu.IdUser == dto.ReceiverId)
                    .Select(cu => cu.IdConversation))
                .FirstOrDefault();

            if (conversationId == 0) {
                var newConv = new Conversation(); 
                _context.Conversations.Add(newConv);
                _context.SaveChanges();
                conversationId = newConv.IdConversation;

                _context.ConversationUsers.Add(new ConversationUser { IdConversation = conversationId, IdUser = myId });
                _context.ConversationUsers.Add(new ConversationUser { IdConversation = conversationId, IdUser = dto.ReceiverId });
                _context.SaveChanges();
            }

            var msg = new Message {
                IdConversation = conversationId,
                IdSender = myId,
                Content = dto.Content
            };

            _context.Messages.Add(msg);
            _context.SaveChanges();

            return Ok(msg);
        } catch (Exception ex) {
            var error = ex.InnerException?.Message ?? ex.Message;
            return StatusCode(500, $"Error DB: {error}");
        }
    }
}

public class MessageDto {
    public int ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
}