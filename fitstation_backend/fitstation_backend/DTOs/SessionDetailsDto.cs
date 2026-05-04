namespace fitstation_backend.DTOs;

public class SessionDetailsDto
{
    public int SessionId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string DayOfWeek { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public string Status { get; set; } = string.Empty;
}