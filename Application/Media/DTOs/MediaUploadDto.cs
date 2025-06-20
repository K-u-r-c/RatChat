using Microsoft.AspNetCore.Http;

namespace Application.Media.DTOs;

public class MediaUploadDto
{
    public required IFormFile File { get; set; }
    public MediaCategory Category { get; set; } = MediaCategory.ProfileImage;
    public string? ChatRoomId { get; set; }
    public string? ChannelId { get; set; }
}