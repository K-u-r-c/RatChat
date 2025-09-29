namespace API.DTOs.Voice;

public class VoiceParticipantDto
{
    public required string ConnectionId { get; set; }
    public required string UserId { get; set; }
    public required string DisplayName { get; set; }
    public required string Slug { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsCameraEnabled { get; set; }
    public bool IsScreenSharing { get; set; }
}
