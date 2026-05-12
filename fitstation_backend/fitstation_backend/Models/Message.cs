using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    [Column("message")] // Sincronizado con tu SQL real
    public string Content { get; set; } = string.Empty;

    [Column("created_at")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)] // MariaDB pone la fecha
    public DateTime? CreatedAt { get; set; }
}