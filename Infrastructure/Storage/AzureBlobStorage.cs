using Application.Core;
using Application.Interfaces;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Storage;

public class AzureBlobStorage(BlobServiceClient blobServiceClient, IConfiguration configuration)
    : IFileStorage
{
    private readonly string _containerName = configuration["AzureStorage:ContainerName"] ?? "media-files";

    public async Task<Result<string>> UploadFileAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder = "")
    {
        try
        {
            var containerClient = await GetContainerClientAsync();
            var blobName = string.IsNullOrEmpty(folder) ? fileName : $"{folder}/{fileName}";
            var blobClient = containerClient.GetBlobClient(blobName);

            var uploadOptions = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
            };

            await blobClient.UploadAsync(fileStream, uploadOptions);

            return Result<string>.Success(blobClient.Uri.ToString());
        }
        catch
        {
            return Result<string>.Failure("Failed to upload file", 500);
        }
    }

    public async Task<Result<string>> DeleteFileAsync(string fileName, string folder = "")
    {
        try
        {
            var containerClient = await GetContainerClientAsync();
            var blobName = string.IsNullOrEmpty(folder) ? fileName : $"{folder}/{fileName}";
            var blobClient = containerClient.GetBlobClient(blobName);

            await blobClient.DeleteIfExistsAsync();
            return Result<string>.Success("File deleted successfully");
        }
        catch
        {
            return Result<string>.Failure("Failed to delete file", 500);
        }
    }

    public async Task<Result<Stream>> GetFileAsync(string fileName, string folder = "")
    {
        try
        {
            var containerClient = await GetContainerClientAsync();
            var blobName = string.IsNullOrEmpty(folder) ? fileName : $"{folder}/{fileName}";
            var blobClient = containerClient.GetBlobClient(blobName);

            var response = await blobClient.DownloadStreamingAsync();
            return Result<Stream>.Success(response.Value.Content);
        }
        catch
        {
            return Result<Stream>.Failure("Failed to get file", 500);
        }
    }

    public string GetFileUrl(string fileName, string folder = "")
    {
        var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
        var blobName = string.IsNullOrEmpty(folder) ? fileName : $"{folder}/{fileName}";
        var blobClient = containerClient.GetBlobClient(blobName);
        return blobClient.Uri.ToString();
    }

    private async Task<BlobContainerClient> GetContainerClientAsync()
    {
        var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);
        return containerClient;
    }
}