using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("conversation_users")]
public class ConversationUser
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("id_conversation")]
    public int IdConversation { get; set; }

    [Column("id_user")]
    public int IdUser { get; set; }
}