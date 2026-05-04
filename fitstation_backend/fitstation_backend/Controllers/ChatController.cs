using Microsoft.AspNetCore.Mvc;
using fitstation_backend.Data;
using fitstation_backend.Models;
using fitstation_backend.DTOs;
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

    [HttpPost("send")]
    public IActionResult SendMessage(SendMessageDto dto)
    {
        var senderId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // 1. Buscar si ya existe una conversación entre estos dos usuarios
        var conversationId = _context.ConversationUsers
            .Where(cu => cu.IdUser == senderId || cu.IdUser == dto.ReceiverId)
            .GroupBy(cu => cu.IdConversation)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .FirstOrDefault();

        // 2. Si no existe, la creamos
        if (conversationId == 0)
        {
            var newConversation = new Conversation();
            _context.Conversations.Add(newConversation);
            _context.SaveChanges();
            conversationId = newConversation.IdConversation;

            _context.ConversationUsers.AddRange(
                new ConversationUser { IdConversation = conversationId, IdUser = senderId },
                new ConversationUser { IdConversation = conversationId, IdUser = dto.ReceiverId }
            );
            _context.SaveChanges();
        }

        // 3. Guardar el mensaje
        var message = new Message
        {
            IdConversation = conversationId,
            IdSender = senderId,
            Content = dto.Content,
            CreatedAt = DateTime.Now
        };

        _context.Messages.Add(message);
        _context.SaveChanges();

        return Ok(new { message = "Mensaje enviado", conversationId });
    }

    [HttpGet("history/{receiverId}")]
    public IActionResult GetChatHistory(int receiverId)
    {
        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // Buscamos la conversación común
        var conversationId = _context.ConversationUsers
            .Where(cu => cu.IdUser == currentUserId || cu.IdUser == receiverId)
            .GroupBy(cu => cu.IdConversation)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .FirstOrDefault();

        if (conversationId == 0) return Ok(new List<Message>());

        var messages = _context.Messages
            .Where(m => m.IdConversation == conversationId)
            .OrderBy(m => m.CreatedAt)
            .ToList();

        return Ok(messages);
    }
}