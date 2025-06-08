using Application.Media.DTOs;

namespace Application.Media.Helpers;

public static class MediaHelpers
{
    public static string GetFolderPath(MediaCategory category, string userId, string? chatRoomId = null, string? channelId = null)
    {
        return category switch
        {
            MediaCategory.ProfileImage => $"users/{userId}/profile/images",
            MediaCategory.ProfileBackground => $"users/{userId}/profile/backgrounds",
            MediaCategory.ChatRoomImage => GetChatRoomPath(chatRoomId, channelId, "images"),
            MediaCategory.ChatRoomVideo => GetChatRoomPath(chatRoomId, channelId, "videos"),
            MediaCategory.ChatRoomAudio => GetChatRoomPath(chatRoomId, channelId, "audio"),
            MediaCategory.ChatRoomDocument => GetChatRoomPath(chatRoomId, channelId, "documents"),
            MediaCategory.ChatRoomOther => GetChatRoomPath(chatRoomId, channelId, "other"),
            _ => "misc"
        };
    }

    private static string GetChatRoomPath(string? chatRoomId, string? channelId, string mediaType)
    {
        if (string.IsNullOrEmpty(chatRoomId))
            throw new ArgumentException("ChatRoomId is required for chat room media", nameof(chatRoomId));

        var basePath = $"chatrooms/{chatRoomId}";

        // If channelId is provided, add it to the path (for future channel support)
        if (!string.IsNullOrEmpty(channelId))
            basePath += $"/channels/{channelId}";
        else
            basePath += "/general"; // default channel

        return $"{basePath}/{mediaType}";
    }

    public static string GetMediaType(string publicId)
    {
        var extension = Path.GetExtension(publicId).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" => "image",
            ".mp4" or ".avi" or ".mov" or ".wmv" or ".flv" => "video",
            ".mp3" or ".wav" or ".flac" or ".aac" or ".ogg" => "audio",
            ".pdf" or ".doc" or ".docx" or ".txt" or ".rtf" => "document",
            _ => "unknown"
        };
    }

    public static async Task<long> GetFileSizeAsync(Stream mediaStream, CancellationToken cancellationToken)
    {
        if (mediaStream.CanSeek)
        {
            return mediaStream.Length;
        }
        else
        {
            using var ms = new MemoryStream();
            await mediaStream.CopyToAsync(ms, cancellationToken);
            return ms.Length;
        }
    }

    public static bool IsChatRoomMedia(MediaCategory category) => category switch
    {
        MediaCategory.ChatRoomImage or MediaCategory.ChatRoomVideo or
        MediaCategory.ChatRoomAudio or MediaCategory.ChatRoomDocument or
        MediaCategory.ChatRoomOther => true,
        _ => false
    };
}