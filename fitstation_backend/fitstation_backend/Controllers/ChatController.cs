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
        // CAMBIO -  lectura del token
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var senderId = int.Parse(claimValue);
        // FIN DEL CAMBIO

        // 1. Buscar si ya existe una conversación entre estos dos usuarios

        // CAMBIO
        // OPTIMIZACIÓN EF CORE: Usamos Contains en lugar de Intersect para evitar errores de traducción SQL
        var receiverConversations = _context.ConversationUsers
            .Where(cu => cu.IdUser == dto.ReceiverId)
            .Select(cu => cu.IdConversation);

        var conversationId = _context.ConversationUsers
            .Where(cu => cu.IdUser == senderId && receiverConversations.Contains(cu.IdConversation))
            .Select(cu => cu.IdConversation)
            .FirstOrDefault();
        // FIN DEL CAMBIO

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
        // CAMBIO -  lectura del token
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return Unauthorized();
        var currentUserId = int.Parse(claimValue);
        // FIN DEL CAMBIO

        // CAMBIO
        // busca la conversacion comun con Contains
        var receiverConversations = _context.ConversationUsers
            .Where(cu => cu.IdUser == receiverId)
            .Select(cu => cu.IdConversation);

        var conversationId = _context.ConversationUsers
            .Where(cu => cu.IdUser == currentUserId && receiverConversations.Contains(cu.IdConversation))
            .Select(cu => cu.IdConversation)
            .FirstOrDefault();
        // FIN DEL CAMBIO

        if (conversationId == 0) return Ok(new List<Message>());

        var messages = _context.Messages
            .Where(m => m.IdConversation == conversationId)
            .OrderBy(m => m.CreatedAt)
            .ToList();

        return Ok(messages);
    }
}