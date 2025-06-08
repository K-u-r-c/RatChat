using Application.Core;

namespace Application.Interfaces;

public interface IFileStorage
{
    Task<Result<string>> UploadFileAsync(Stream fileStream, string fileName, string contentType, string folder = "");
    Task<Result<string>> DeleteFileAsync(string fileName, string folder = "");
    Task<Result<Stream>> GetFileAsync(string fileName, string folder = "");
    string GetFileUrl(string fileName, string folder = "");
}