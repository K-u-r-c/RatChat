namespace Application.ChatChannels.DTOs;

public class CreateChatChannelRequest
{
    public required string Name { get; set; }
    public required string Type { get; set; }
}