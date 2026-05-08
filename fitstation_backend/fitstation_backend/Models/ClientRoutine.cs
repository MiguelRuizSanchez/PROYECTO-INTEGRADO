using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("client_routines")]
public class ClientRoutine
{
    // CAMBIO - coincide exactamente con la columna de la BD
    [Key]
    [Column("id")] 
    public int Id { get; set; } 
    // FIN DEL CAMBIO

    [Column("id_client")]
    public int IdClient { get; set; }

    [Column("id_routine")]
    public int IdRoutine { get; set; }
}