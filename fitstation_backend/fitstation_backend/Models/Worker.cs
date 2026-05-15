using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("workers")]
public class Worker
{
    [Key]
    [Column("id_worker")]
    public int IdWorker { get; set; }

    [Column("id_user")]
    public int IdUser { get; set; }

    [Column("specialty")]
    public string? Specialty { get; set; }

    [Column("specialization")]
    public string? Specialization { get; set; }

    [Column("bio")]
    public string? Bio { get; set; }

    [Column("price_per_session")]
    public decimal PricePerSession { get; set; }

    [Column("max_capacity")]
    public int MaxCapacity { get; set; }
}