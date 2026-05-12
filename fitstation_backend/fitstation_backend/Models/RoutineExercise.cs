using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("routine_exercises")]
public class RoutineExercise
{
    [Key]
    [Column("id")] // Mapeamos al 'id' que ya existe en tu DB
    public int Id { get; set; }

    [Column("id_routine")]
    public int IdRoutine { get; set; }

    [Column("id_exercise")]
    public int IdExercise { get; set; }

    [Column("series")] // Mapeamos a la columna 'series' de tu SQL
    public int Sets { get; set; }

    [Column("repetitions")] // Mapeamos a la columna 'repetitions' de tu SQL
    public int Reps { get; set; }

    [Column("rest_seconds")]
    public int RestSeconds { get; set; }
}