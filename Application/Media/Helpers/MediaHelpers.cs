using Application.Media.DTOs;

namespace Application.Media.Helpers;

public static class MediaHelpers
{
    public static string GetFolderName(MediaCategory category) => category switch
    {
        MediaCategory.ProfileImage => "profile-images",
        _ => "misc"
    };

    public static string GetMediaType(string publicId)
    {
        var extension = Path.GetExtension(publicId).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" => "image",
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
}
