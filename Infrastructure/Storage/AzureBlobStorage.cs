using Application.Core;
using Application.Interfaces;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Storage;

public class AzureBlobStorage(
    BlobServiceClient blobServiceClient,
    IConfiguration configuration)
    : IFileStorage
{
    private readonly string _containerName = configuration["AzureStorage:ContainerName"] ?? "media-files";
    private readonly string _baseUrl = configuration["AzureStorage:BaseUrl"] ?? "";

    public async Task<Result<string>> UploadFileAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder = "")
    {
        try
        {
            var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

            var blobName = string.IsNullOrEmpty(folder)
                ? fileName
                : $"{folder.Trim('/')}/{fileName}";

            var blobClient = containerClient.GetBlobClient(blobName);

            var blobUploadOptions = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType,
                    CacheControl = "public, max-age=31536000" // Cache for 1 year
                },
                Metadata = new Dictionary<string, string>
                {
                    { "UploadedAt", DateTime.UtcNow.ToString("O") },
                    { "OriginalName", fileName }
                }
            };

            await blobClient.UploadAsync(fileStream, blobUploadOptions);

            var blobUrl = string.IsNullOrEmpty(_baseUrl)
                ? blobClient.Uri.ToString()
                : $"{_baseUrl.TrimEnd('/')}/{blobName}";

            return Result<string>.Success(blobUrl);
        }
        catch (Exception ex)
        {
            return Result<string>.Failure($"Failed to upload file: {ex.Message}", 500);
        }
    }

    public async Task<Result<string>> DeleteFileAsync(string fileName, string folder = "")
    {
        try
        {
            var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

            var blobName = string.IsNullOrEmpty(folder)
                ? fileName
                : $"{folder.Trim('/')}/{fileName}";

            var blobClient = containerClient.GetBlobClient(blobName);

            var response = await blobClient.DeleteIfExistsAsync();

            if (response.Value)
            {
                return Result<string>.Success("File deleted successfully");
            }
            else
            {
                return Result<string>.Success("File not found (already deleted)");
            }
        }
        catch (Exception ex)
        {
            return Result<string>.Failure($"Failed to delete file: {ex.Message}", 500);
        }
    }

    public async Task<Result<Stream>> GetFileAsync(string fileName, string folder = "")
    {
        try
        {
            var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

            var blobName = string.IsNullOrEmpty(folder)
                ? fileName
                : $"{folder.Trim('/')}/{fileName}";

            var blobClient = containerClient.GetBlobClient(blobName);

            var exists = await blobClient.ExistsAsync();
            if (!exists.Value)
            {
                return Result<Stream>.Failure("File not found", 404);
            }

            var response = await blobClient.DownloadStreamingAsync();

            return Result<Stream>.Success(response.Value.Content);
        }
        catch (Exception ex)
        {
            return Result<Stream>.Failure($"Failed to retrieve file: {ex.Message}", 500);
        }
    }

    public string GetFileUrl(string fileName, string folder = "")
    {
        try
        {
            var blobName = string.IsNullOrEmpty(folder)
                ? fileName
                : $"{folder.Trim('/')}/{fileName}";

            var publicUrl = string.IsNullOrEmpty(_baseUrl)
                ? $"https://{blobServiceClient.AccountName}.blob.core.windows.net/{_containerName}/{blobName}"
                : $"{_baseUrl.TrimEnd('/')}/{blobName}";

            return publicUrl;
        }
        catch
        {
            return string.Empty;
        }
    }
}