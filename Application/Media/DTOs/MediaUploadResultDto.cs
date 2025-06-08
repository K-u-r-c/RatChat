namespace Application.Media.DTOs;

public class MediaUploadResultDto
{
    public string Url { get; set; } = "";
    public string PublicId { get; set; } = "";
    public string MediaType { get; set; } = "";
    public long FileSize { get; set; }
    public string OriginalFileName { get; set; } = "";
}