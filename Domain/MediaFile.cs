namespace Domain;

public class MediaFile
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string PublicId { get; set; }
    public required string Url { get; set; }
    public required string MediaType { get; set; }
    public long FileSize { get; set; }
    public required string OriginalFileName { get; set; }
    public required string Category { get; set; }
    public string? ChatRoomId { get; set; }
    public string? ChannelId { get; set; }
    public required string UploadedById { get; set; }
    public User UploadedBy { get; set; } = null!;
    public required string FileHash { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int ReferenceCount { get; set; } = 1;

    // Navigation properties
    public ChatRoom? ChatRoom { get; set; }
}