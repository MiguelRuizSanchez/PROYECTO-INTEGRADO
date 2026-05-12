namespace fitstation_backend.DTOs;

public class UpdateProfileDto
{
    // Campos de Cliente
    public string? Objectives { get; set; }
    public string? ExperienceLevel { get; set; }
    public string? Modality { get; set; }
    public string? MedicalNotes { get; set; }
    public string? Equipment { get; set; }
    public string? PrefDay { get; set; }
    public string? PrefTime { get; set; } // Recibimos como string (ej: "10:00:00")

    // Campos de Entrenador
    public string? Specialization { get; set; }
    public string? Bio { get; set; }
    public decimal? PricePerSession { get; set; }
    public int? MaxCapacity { get; set; }
}