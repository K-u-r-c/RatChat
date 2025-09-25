namespace Application.ChatRooms.DTOs;

public class ChatChannelDto
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Type { get; set; }
    public int Position { get; set; }
    public DateTime CreatedAt { get; set; }
}
