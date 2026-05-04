namespace fitstation_backend.DTOs;

public class UserProfileDto
{
    public int IdUser { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;

    public string? PrefDay { get; set; }
    public TimeSpan? PrefTime { get; set; }

    public string? Specialty { get; set; }
}