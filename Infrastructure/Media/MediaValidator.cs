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
        },
        [MediaCategory.ProfileBackground] = new MediaConfig
        {
            AllowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
            MaxFileSize = 25 * 1024 * 1024, // 25MB
            AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        },
        [MediaCategory.ChatRoomImage] = new MediaConfig
        {
            AllowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
            MaxFileSize = 10 * 1024 * 1024, // 10MB
            AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        },
        [MediaCategory.ChatRoomVideo] = new MediaConfig
        {
            AllowedTypes = ["video/mp4", "video/avi", "video/quicktime", "video/x-msvideo"],
            MaxFileSize = 100 * 1024 * 1024, // 100MB
            AllowedExtensions = [".mp4", ".avi", ".mov", ".wmv"]
        },
        [MediaCategory.ChatRoomAudio] = new MediaConfig
        {
            AllowedTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac", "audio/ogg"],
            MaxFileSize = 10 * 1024 * 1024, // 10MB
            AllowedExtensions = [".mp3", ".wav", ".flac", ".aac", ".ogg"]
        },
        [MediaCategory.ChatRoomDocument] = new MediaConfig
        {
            AllowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"],
            MaxFileSize = 25 * 1024 * 1024, // 25MB
            AllowedExtensions = [".pdf", ".doc", ".docx", ".txt"]
        },
        [MediaCategory.ChatRoomOther] = new MediaConfig
        {
            AllowedTypes = ["application/zip", "application/x-rar-compressed", "application/x-7z-compressed"],
            MaxFileSize = 50 * 1024 * 1024, // 50MB
            AllowedExtensions = [".zip", ".rar", ".7z"]
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