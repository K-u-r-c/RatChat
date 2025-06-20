namespace Application.Status.DTOs;

public class UpdateStatusDto
{
    public required string Status { get; set; }
    public string? CustomMessage { get; set; }
}