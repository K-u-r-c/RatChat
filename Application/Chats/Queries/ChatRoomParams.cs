using Application.Core;

namespace Application.Chats.Queries;

public class ChatRoomParams : PaginationParams<DateTime?>
{
    public string? Filter { get; set; }
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
}
