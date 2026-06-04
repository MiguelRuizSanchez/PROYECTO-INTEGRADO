using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("conversations")]
public class Conversation
{
    [Key]
    [Column("id_conversation")]
    public int IdConversation { get; set; }

    [Column("created_at")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public DateTime? CreatedAt { get; set; }
}