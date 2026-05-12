using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("clients")]
public class Client
{
    [Key]
    [Column("id_client")]
    public int IdClient { get; set; }

    [Column("id_user")]
    public int IdUser { get; set; }

    [Column("goal")]
    public string? Goal { get; set; }

    [Column("objectives")]
    public string? Objectives { get; set; }

    [Column("experience_level")]
    public string? ExperienceLevel { get; set; }

    [Column("modality")]
    public string? Modality { get; set; }

    [Column("medical_notes")]
    public string? MedicalNotes { get; set; }

    [Column("equipment")]
    public string? Equipment { get; set; }

    [Column("pref_day")] // 👈 Mapeo exacto para evitar el Error 500
    public string? PrefDay { get; set; }

    [Column("pref_time")] // 👈 Mapeo exacto
    public TimeSpan? PrefTime { get; set; }
}