using Application.Core;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;

namespace Infrastructure.Storage;

public class MinioStorage(IMinioClient minioClient, IConfiguration configuration)
    : IFileStorage
{
    private readonly string _bucketName = configuration["MinIO:BucketName"] ?? "media-files";
    private readonly string _endpoint = configuration["MinIO:Endpoint"] ?? "localhost:9000";

    public async Task<Result<string>> UploadFileAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder = "")
    {
        try
        {
            await EnsureBucketExistsAsync();

            var objectName = string.IsNullOrEmpty(folder) ? fileName : $"{folder}/{fileName}";

            var putObjectArgs = new PutObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName)
                .WithStreamData(fileStream)
                .WithObjectSize(fileStream.Length)
                .WithContentType(contentType);

            await minioClient.PutObjectAsync(putObjectArgs);

            var url = GetFileUrl(fileName, folder);
            return Result<string>.Success(url);
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
            var objectName = string.IsNullOrEmpty(folder) ? fileName : $"{folder}/{fileName}";

            var removeObjectArgs = new RemoveObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName);

            await minioClient.RemoveObjectAsync(removeObjectArgs);
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
            var stream = new MemoryStream();
            var objectName = string.IsNullOrEmpty(folder) ? fileName : $"{folder}/{fileName}";

            var getObjectArgs = new GetObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName)
                .WithCallbackStream(s => s.CopyTo(stream));

            await minioClient.GetObjectAsync(getObjectArgs);
            stream.Position = 0;
            return Result<Stream>.Success(stream);
        }
        catch
        {
            return Result<Stream>.Failure("Failed to get file", 500);
        }
    }

    public string GetFileUrl(string fileName, string folder = "")
    {
        var objectName = string.IsNullOrEmpty(folder) ? fileName : $"{folder}/{fileName}";
        return $"http://{_endpoint}/{_bucketName}/{objectName}";
    }

    private async Task EnsureBucketExistsAsync()
    {
        var bucketExistsArgs = new BucketExistsArgs().WithBucket(_bucketName);
        var exists = await minioClient.BucketExistsAsync(bucketExistsArgs);

        if (!exists)
        {
            var makeBucketArgs = new MakeBucketArgs().WithBucket(_bucketName);
            await minioClient.MakeBucketAsync(makeBucketArgs);

            var policy = $@"{{
                ""Version"": ""2012-10-17"",
                ""Statement"": [
                    {{
                        ""Effect"": ""Allow"",
                        ""Principal"": {{
                            ""AWS"": [""*""]
                        }},
                        ""Action"": [""s3:GetObject""],
                        ""Resource"": [""arn:aws:s3:::{_bucketName}/*""]
                    }}
                ]
            }}";

            var setPolicyArgs = new SetPolicyArgs()
                .WithBucket(_bucketName)
                .WithPolicy(policy);

            await minioClient.SetPolicyAsync(setPolicyArgs);
        }
    }
}