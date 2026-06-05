using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("conversation_users")]
public class ConversationUser
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Column("id_conversation")]
    public int IdConversation { get; set; }

    [Column("id_worker")]
    public int IdWorker { get; set; }

    [Column("id_client")]
    public int IdClient { get; set; }
}