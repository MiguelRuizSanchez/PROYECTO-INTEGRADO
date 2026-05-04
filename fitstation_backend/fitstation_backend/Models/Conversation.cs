using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace fitstation_backend.Models;

[Table("conversations")]
public class Conversation
{
    [Key]
    [Column("id_conversation")] // <--- Añade esto para que coincida con Heidi
    public int IdConversation { get; set; }

    [Column("created_at")] // <--- Añade esto también para la fecha
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}