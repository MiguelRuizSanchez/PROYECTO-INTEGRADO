using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace fitstation_backend.Models;

[Table("messages")]
public class Message
{
    [Key]
    [Column("id_message")]
    public int IdMessage { get; set; }

    [Column("id_conversation")]
    public int IdConversation { get; set; }

    [Column("id_sender")]
    public int IdSender { get; set; }

    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}