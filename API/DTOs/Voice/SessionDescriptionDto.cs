namespace API.DTOs.Voice;

public class SessionDescriptionDto
{
    public required string Type { get; set; }
    public required string Sdp { get; set; }
}