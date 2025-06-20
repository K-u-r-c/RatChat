using Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Persistance;

namespace Infrastructure.Services;

public class MediaCleanupService(
    IServiceProvider serviceProvider,
    ILogger<MediaCleanupService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupOrphanedMediaFiles(stoppingToken);
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred during media cleanup");
                try
                {
                    await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
    }

    private async Task CleanupOrphanedMediaFiles(CancellationToken cancellationToken)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var fileStorage = scope.ServiceProvider.GetRequiredService<IFileStorage>();

        var cutoffDate = DateTime.UtcNow.AddHours(-24);

        var orphanedFiles = await context.MediaFiles
            .Where(m => m.CreatedAt < cutoffDate)
            .Where(m =>
                !context.Users.Any(u => u.ImageUrl != null && u.ImageUrl.Contains(m.PublicId)) &&
                !context.Users.Any(u => u.BannerUrl != null && u.BannerUrl.Contains(m.PublicId)) &&
                !context.Messages.Any(msg => msg.MediaPublicId == m.PublicId) &&
                !context.DirectMessages.Any(dm => dm.MediaPublicId == m.PublicId))
            .ToListAsync(cancellationToken);

        if (orphanedFiles.Count == 0)
        {
            logger.LogInformation("No orphaned media files found");
            return;
        }

        var deletedCount = 0;

        foreach (var mediaFile in orphanedFiles)
        {
            var folderPath = GetFolderPathForCleanup(mediaFile);

            var deleteResult = await fileStorage.DeleteFileAsync(mediaFile.PublicId, folderPath);

            if (deleteResult.IsSuccess)
            {
                context.MediaFiles.Remove(mediaFile);
                deletedCount++;
                logger.LogInformation("Deleted orphaned media file: {PublicId}", mediaFile.PublicId);
            }
            else
            {
                logger.LogWarning("Failed to delete media file from storage: {PublicId}, Error: {Error}",
                    mediaFile.PublicId, deleteResult.Error);
            }
        }

        if (deletedCount > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Cleanup completed. Deleted {Count} orphaned media files", deletedCount);
        }
    }

    private static string GetFolderPathForCleanup(Domain.MediaFile mediaFile)
    {
        return mediaFile.Category switch
        {
            "ProfileImage" => $"users/{mediaFile.UploadedById}/profile/images",
            "ProfileBackground" => $"users/{mediaFile.UploadedById}/profile/backgrounds",
            "ChatRoomImage" => GetChatRoomPath(mediaFile.ChatRoomId, mediaFile.ChannelId, "images"),
            "ChatRoomVideo" => GetChatRoomPath(mediaFile.ChatRoomId, mediaFile.ChannelId, "videos"),
            "ChatRoomAudio" => GetChatRoomPath(mediaFile.ChatRoomId, mediaFile.ChannelId, "audio"),
            "ChatRoomDocument" => GetChatRoomPath(mediaFile.ChatRoomId, mediaFile.ChannelId, "documents"),
            "ChatRoomOther" => GetChatRoomPath(mediaFile.ChatRoomId, mediaFile.ChannelId, "other"),
            _ => "misc"
        };
    }

    private static string GetChatRoomPath(string? chatRoomId, string? channelId, string mediaType)
    {
        if (string.IsNullOrEmpty(chatRoomId))
            return $"misc/{mediaType}";

        var basePath = $"chatrooms/{chatRoomId}";

        if (!string.IsNullOrEmpty(channelId))
            basePath += $"/channels/{channelId}";
        else
            basePath += "/general";

        return $"{basePath}/{mediaType}";
    }
}