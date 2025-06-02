using Application.Profiles.DTOs;

namespace Application.Chats.DTOs;

public class ChatRoomDto
{
    public required string Id { get; set; }
    public required string Title { get; set; }
    public DateTime Date { get; set; }
    public required string AdminDisplayName { get; set; }
    public required string AdminId { get; set; }

    // Navigation properties
    public ICollection<UserProfileDto> Members { get; set; } = [];
}
