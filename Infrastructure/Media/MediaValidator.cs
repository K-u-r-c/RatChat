using Application.Interfaces;
using Application.Media.DTOs;

namespace Infrastructure.Media;

public class MediaValidator : IMediaValidator
{
    private readonly Dictionary<MediaCategory, MediaConfig> _mediaConfigs = new()
    {
        [MediaCategory.ProfileImage] = new MediaConfig
        {
            AllowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
            MaxFileSize = 5 * 1024 * 1024, // 5MB
            AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        }
    };

    public bool IsValidMediaType(string contentType, MediaCategory category)
    {
        if (!_mediaConfigs.TryGetValue(category, out var config))
            return false;

        return config.AllowedTypes.Contains(contentType.ToLower());
    }

    public bool IsValidFileSize(long fileSize, MediaCategory category)
    {
        if (!_mediaConfigs.TryGetValue(category, out var config))
            return false;

        return fileSize <= config.MaxFileSize;
    }

    public string[] GetAllowedExtensions(MediaCategory category)
    {
        return _mediaConfigs.TryGetValue(category, out var config)
            ? config.AllowedExtensions
            : [];
    }

    public long GetMaxFileSize(MediaCategory category)
    {
        return _mediaConfigs.TryGetValue(category, out var config)
            ? config.MaxFileSize
            : 0;
    }
}