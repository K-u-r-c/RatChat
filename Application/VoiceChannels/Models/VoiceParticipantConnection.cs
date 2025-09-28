namespace Application.VoiceChannels.Models;

public class VoiceParticipantConnection
{
    public required string ConnectionId { get; init; }
    public required string UserId { get; init; }
    public required string DisplayName { get; init; }
    public required string Slug { get; init; }
    public string? ImageUrl { get; init; }
    public required string ChatRoomId { get; init; }
    public required string ChannelId { get; set; }
    public bool IsCameraEnabled { get; set; }
    public bool IsScreenSharing { get; set; }
}