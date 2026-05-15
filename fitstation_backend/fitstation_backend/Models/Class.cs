using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models
{
    [Table("classes")]
    public class Class
    {
        [Key]
        [Column("id_class")]
        public int IdClass { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        public string Description { get; set; } = string.Empty;

        // 🚀 Columnas para los turnos de trabajo del entrenador
        [Column("id_worker")]
        public int? IdWorker { get; set; }

        [Column("day_of_week")]
        public string? DayOfWeek { get; set; }

        [Column("class_time")]
        public string? ClassTime { get; set; }
    }
}