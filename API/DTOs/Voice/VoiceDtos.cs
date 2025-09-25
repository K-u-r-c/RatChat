using System.Collections.Generic;

namespace API.DTOs.Voice;

public class VoiceParticipantDto
{
    public required string ConnectionId { get; set; }
    public required string UserId { get; set; }
    public required string DisplayName { get; set; }
    public required string Slug { get; set; }
    public string? ImageUrl { get; set; }
}

public class VoiceChannelJoinResponseDto
{
    public required string ChannelId { get; set; }
    public required string SelfConnectionId { get; set; }
    public List<VoiceParticipantDto> Participants { get; set; } = [];
}

public class VoicePeerUpdateDto
{
    public required string ChannelId { get; set; }
    public required VoiceParticipantDto Participant { get; set; }
}

public class SessionDescriptionDto
{
    public required string Type { get; set; }
    public required string Sdp { get; set; }
}

public class VoiceSignalMessageDto
{
    public required string ChannelId { get; set; }
    public required string FromConnectionId { get; set; }
    public required SessionDescriptionDto Description { get; set; }
}

public class IceCandidateDto
{
    public required string Candidate { get; set; }
    public string? SdpMid { get; set; }
    public int? SdpMLineIndex { get; set; }
}

public class VoiceIceCandidateMessageDto
{
    public required string ChannelId { get; set; }
    public required string FromConnectionId { get; set; }
    public required IceCandidateDto Candidate { get; set; }
}

