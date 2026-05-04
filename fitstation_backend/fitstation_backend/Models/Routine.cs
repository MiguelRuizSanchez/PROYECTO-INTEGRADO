using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("routines")]
public class Routine
{
    [Key]
    [Column("id_routine")]
    public int IdRoutine { get; set; }

    [Column("id_worker")]
    public int? IdWorker { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("description")]
    public string? Description { get; set; }
}