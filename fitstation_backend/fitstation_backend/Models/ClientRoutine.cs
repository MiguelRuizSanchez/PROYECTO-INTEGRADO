using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("client_routines")]
public class ClientRoutine
{
    [Key]
    [Column("id_client_routine")]
    public int IdClientRoutine { get; set; }

    [Column("id_client")]
    public int IdClient { get; set; }

    [Column("id_routine")]
    public int IdRoutine { get; set; }
}