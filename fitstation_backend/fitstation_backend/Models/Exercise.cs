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
    public string Name { get; set; } = null!;

    [Column("muscle_group")]
    public string? MuscleGroup { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("image_url")]
    public string? ImageUrl { get; set; }
}