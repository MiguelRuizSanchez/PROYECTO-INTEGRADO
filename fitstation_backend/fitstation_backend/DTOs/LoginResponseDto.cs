namespace fitstation_backend.DTOs;

public class LoginResponseDto
{
    public string Message { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public int UserId { get; set; }
}