namespace Application.Notifications.DTOs;

public class NotificationCountersDto
{
    public Dictionary<string, int> ChatRooms { get; set; } = [];
    public Dictionary<string, int> DirectChats { get; set; } = [];
    public Dictionary<string, int> EncryptedDirectChats { get; set; } = [];
}
