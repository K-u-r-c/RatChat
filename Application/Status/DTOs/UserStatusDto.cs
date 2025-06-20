namespace Application.Status.DTOs;

public class UserStatusDto
{
    public required string UserId { get; set; }
    public required string Status { get; set; }
    public string? CustomMessage { get; set; }
    public DateTime LastSeen { get; set; }
    public bool IsOnline { get; set; }
}
