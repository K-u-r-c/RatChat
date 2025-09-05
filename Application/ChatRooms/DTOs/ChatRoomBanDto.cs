namespace Application.ChatRooms.DTOs;

public class ChatRoomBanDto
{
    public required string UserId { get; set; }

    public required string ChatRoomId { get; set; }

    public DateTime DateBanned { get; set; }
}
