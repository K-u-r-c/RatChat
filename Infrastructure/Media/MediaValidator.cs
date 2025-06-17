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
            AllowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff", "image/svg+xml"],
            MaxFileSize = 20 * 1024 * 1024, // 20MB
            AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".svg"]
        },
        [MediaCategory.ChatRoomVideo] = new MediaConfig
        {
            AllowedTypes = ["video/mp4", "video/avi", "video/quicktime", "video/x-msvideo", "video/webm", "video/ogg", "video/x-ms-wmv"],
            MaxFileSize = 200 * 1024 * 1024, // 200MB
            AllowedExtensions = [".mp4", ".avi", ".mov", ".wmv", ".webm", ".ogv", ".mkv"]
        },
        [MediaCategory.ChatRoomAudio] = new MediaConfig
        {
            AllowedTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/webm"],
            MaxFileSize = 50 * 1024 * 1024, // 50MB
            AllowedExtensions = [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".weba"]
        },
        [MediaCategory.ChatRoomDocument] = new MediaConfig
        {
            AllowedTypes = [
                // Office documents
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                // Text files
                "text/plain",
                "text/csv",
                "application/rtf",
                "text/markdown",
                "text/html",
                "text/css",
                "application/json",
                "application/xml",
                "text/xml",
                // Code files
                "text/javascript",
                "application/javascript",
                "text/typescript",
                "text/x-python",
                "text/x-java-source",
                "text/x-csharp",
                "text/x-c++src",
                "text/x-csrc",
                "text/x-php",
                "text/x-ruby",
                "text/x-go",
                "text/x-rust",
                "text/x-swift",
                "text/x-kotlin",
                "text/x-scala",
                "application/x-yaml",
                "text/yaml",
                "application/toml",
                "text/x-dockerfile"
            ],
            MaxFileSize = 100 * 1024 * 1024, // 100MB
            AllowedExtensions = [
                // Office documents
                ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", 
                // Text files
                ".txt", ".csv", ".rtf", ".md", ".html", ".css", ".json", ".xml",
                // Code files
                ".js", ".ts", ".py", ".java", ".cs", ".cpp", ".c", ".h", ".hpp",
                ".php", ".rb", ".go", ".rs", ".swift", ".kt", ".scala", ".yml", ".yaml",
                ".toml", ".dockerfile", ".gitignore", ".env", ".config", ".ini",
                // Additional code file extensions
                ".jsx", ".tsx", ".vue", ".svelte", ".sass", ".scss", ".less",
                ".sql", ".sh", ".bat", ".ps1", ".r", ".m", ".pl", ".lua",
                ".dart", ".elm", ".clj", ".fs", ".vb", ".pas", ".asm"
            ]
        },
        [MediaCategory.ChatRoomOther] = new MediaConfig
        {
            AllowedTypes = [
                // Archives
                "application/zip",
                "application/x-rar-compressed",
                "application/x-7z-compressed",
                "application/gzip",
                "application/x-tar",
                "application/x-bzip2",
                // Fonts
                "font/ttf",
                "font/otf",
                "font/woff",
                "font/woff2",
                "application/font-woff",
                "application/font-woff2",
                // 3D models
                "model/obj",
                "model/gltf+json",
                "application/octet-stream", // For .glb, .blend files
                // Data files
                "application/x-sqlite3",
                "text/calendar"
            ],
            MaxFileSize = 100 * 1024 * 1024, // 100MB
            AllowedExtensions = [
                // Archives
                ".zip", ".rar", ".7z", ".gz", ".tar", ".bz2", ".xz",
                // Fonts
                ".ttf", ".otf", ".woff", ".woff2", ".eot",
                // 3D models
                ".obj", ".mtl", ".gltf", ".glb", ".fbx", ".dae", ".blend",
                // Data files
                ".sqlite", ".db", ".ics", ".vcf"
            ]
        }
    };

    public bool IsValidMediaType(string contentType, MediaCategory category)
    {
        if (!_mediaConfigs.TryGetValue(category, out var config))
            return false;

        // Handle special cases for code files that might come as text/plain
        if (contentType == "text/plain" && category == MediaCategory.ChatRoomDocument)
        {
            return true;
        }

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