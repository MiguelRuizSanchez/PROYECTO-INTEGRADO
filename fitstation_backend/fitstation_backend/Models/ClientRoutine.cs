using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("client_routines")]
public class ClientRoutine
{
    [Key]
    [Column("id")] // 🚀 MÁGICO: Le aclaramos a C# que se llama 'id' y no 'id_client_routine'
    public int Id { get; set; }

    [Column("id_client")]
    public int IdClient { get; set; }

    [Column("id_routine")]
    public int IdRoutine { get; set; }

    // ❌ Eliminada cualquier propiedad de fecha porque tu tabla real solo tiene 3 columnas
}