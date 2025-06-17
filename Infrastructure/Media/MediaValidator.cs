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
            AllowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff"],
            MaxFileSize = 20 * 1024 * 1024, // 20MB
            AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"]
        },
        [MediaCategory.ChatRoomVideo] = new MediaConfig
        {
            AllowedTypes = ["video/mp4", "video/avi", "video/quicktime", "video/x-msvideo", "video/webm", "video/ogg"],
            MaxFileSize = 200 * 1024 * 1024, // 200MB
            AllowedExtensions = [".mp4", ".avi", ".mov", ".wmv", ".webm", ".ogv"]
        },
        [MediaCategory.ChatRoomAudio] = new MediaConfig
        {
            AllowedTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac", "audio/ogg", "audio/mp4", "audio/x-m4a"],
            MaxFileSize = 50 * 1024 * 1024, // 50MB
            AllowedExtensions = [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"]
        },
        [MediaCategory.ChatRoomDocument] = new MediaConfig
        {
            AllowedTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "text/plain",
                "text/csv",
                "application/rtf"
            ],
            MaxFileSize = 100 * 1024 * 1024, // 100MB
            AllowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".rtf"]
        },
        [MediaCategory.ChatRoomOther] = new MediaConfig
        {
            AllowedTypes = [
                "application/zip",
                "application/x-rar-compressed",
                "application/x-7z-compressed",
                "application/gzip",
                "application/x-tar"
            ],
            MaxFileSize = 100 * 1024 * 1024, // 100MB
            AllowedExtensions = [".zip", ".rar", ".7z", ".gz", ".tar"]
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

    public static bool IsChatMediaCategory(MediaCategory category)
    {
        return category is MediaCategory.ChatRoomImage or
                          MediaCategory.ChatRoomVideo or
                          MediaCategory.ChatRoomAudio or
                          MediaCategory.ChatRoomDocument or
                          MediaCategory.ChatRoomOther;
    }

    public static string GetMediaCategoryDisplayName(MediaCategory category)
    {
        return category switch
        {
            MediaCategory.ProfileImage => "Profile Image",
            MediaCategory.ProfileBackground => "Profile Background",
            MediaCategory.ChatRoomImage => "Image",
            MediaCategory.ChatRoomVideo => "Video",
            MediaCategory.ChatRoomAudio => "Audio",
            MediaCategory.ChatRoomDocument => "Document",
            MediaCategory.ChatRoomOther => "Archive",
            _ => "Unknown"
        };
    }
}