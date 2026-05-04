using System.ComponentModel.DataAnnotations; // <--- FALTA ESTO
using System.ComponentModel.DataAnnotations.Schema; // <--- Y ESTO

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

    [Column("pref_day")]
    public string? PrefDay { get; set; }

    [Column("pref_time")]
    public TimeSpan? PrefTime { get; set; }
}