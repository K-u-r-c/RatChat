using Application.Profiles.DTOs;

namespace Application.ChatRooms.DTOs;

public class ChatRoomDto
{
    public required string Id { get; set; }
    public required string Title { get; set; }
    public required string Slug { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime Date { get; set; }
    public required string OwnerDisplayName { get; set; }
    public required string OwnerId { get; set; }

    // Navigation properties
    public ICollection<UserProfileDto> Members { get; set; } = [];
    public ICollection<ChatRoomBanDto> Bans { get; set; } = [];
    public ICollection<ChatChannelDto> Channels { get; set; } = [];
}

