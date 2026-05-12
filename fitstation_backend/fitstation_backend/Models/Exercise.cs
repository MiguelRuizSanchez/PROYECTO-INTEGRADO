using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("exercises")]
public class Exercise
{
    [Key]
    [Column("id_exercise")]
    public int IdExercise { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("muscle_group")]
    public string? MuscleGroup { get; set; }

    [Column("video_url")]
    public string? VideoUrl { get; set; }
}