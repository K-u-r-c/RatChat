namespace API.DTOs.Voice;

public class VoiceMediaStateDto
{
    public required string ConnectionId { get; set; }
    public bool IsCameraEnabled { get; set; }
    public bool IsScreenSharing { get; set; }
}
