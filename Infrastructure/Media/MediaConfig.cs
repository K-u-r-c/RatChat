namespace Infrastructure.Media;

public class MediaConfig
{
    public required string[] AllowedTypes { get; set; }
    public required long MaxFileSize { get; set; }
    public required string[] AllowedExtensions { get; set; }
}
