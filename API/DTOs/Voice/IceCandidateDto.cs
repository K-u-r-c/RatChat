namespace API.DTOs.Voice;

public class IceCandidateDto
{
    public required string Candidate { get; set; }
    public string? SdpMid { get; set; }
    public int? SdpMLineIndex { get; set; }
}