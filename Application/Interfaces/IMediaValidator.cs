using Application.Media.DTOs;

namespace Application.Interfaces;

public interface IMediaValidator
{
    bool IsValidMediaType(string? contentType, string? fileExtension, MediaCategory category);
    bool IsValidFileSize(long fileSize, MediaCategory category);
    string[] GetAllowedExtensions(MediaCategory category);
    long GetMaxFileSize(MediaCategory category);
}
