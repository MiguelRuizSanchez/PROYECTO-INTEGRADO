using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace fitstation_backend.Models;

[Table("conversations")]
public class Conversation
{
    [Key]
    [Column("id_conversation")] 
    public int IdConversation { get; set; }

    [Column("created_at")] 
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}