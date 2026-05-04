using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models;

[Table("sessions")]
public class Session
{
    [Key]
    [Column("id_session")]
    public int IdSession { get; set; }

    [Column("id_request")]
    public int IdRequest { get; set; }

    [Column("id_client")]
    public int IdClient { get; set; }

    [Column("id_worker")]
    public int IdWorker { get; set; }

    [Column("scheduled_date")]
    public DateTime? ScheduledDate { get; set; }

    [Column("duration_minutes")]
    public int DurationMinutes { get; set; }

    [Column("day_of_week")]
    public string DayOfWeek { get; set; } = string.Empty;

    [Column("start_time")]
    public TimeSpan StartTime { get; set; }

    [Column("status")]
    public string Status { get; set; } = "Scheduled";
}