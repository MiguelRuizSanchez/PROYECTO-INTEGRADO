using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("routine_exercises")]
public class RoutineExercise
{
    [Key]
    [Column("id")] 
    public int Id { get; set; }

    [Column("id_routine")]
    public int IdRoutine { get; set; }

    [Column("id_exercise")]
    public int IdExercise { get; set; }

    [Column("reps")] // Coincide con tu captura
    public int Reps { get; set; }

    [Column("sets")] // Coincide con tu captura
    public int Sets { get; set; }

    // ❌ He eliminado RestSeconds porque no aparece en tu tabla física
}