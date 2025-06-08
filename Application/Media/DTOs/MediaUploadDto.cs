using Microsoft.AspNetCore.Http;

namespace Application.Media.DTOs;

public class MediaUploadDto
{
    public required IFormFile File { get; set; }
    public MediaCategory Category { get; set; } = MediaCategory.ProfileImage;
}