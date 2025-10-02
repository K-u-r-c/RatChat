namespace API.DTOs.Voice;

public class VoiceMediaStateUpdateDto
{
    public bool IsCameraEnabled { get; set; }
    public bool IsScreenSharing { get; set; }
    public bool IsMuted { get; set; }
}
