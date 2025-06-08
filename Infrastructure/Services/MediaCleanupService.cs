using Application.Interfaces;
using Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Persistance;

namespace Infrastructure.Services;

public class MediaCleanupService(
    IServiceProvider serviceProvider)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupUnusedMediaFiles();
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
            catch
            {
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
        }
    }

    private async Task CleanupUnusedMediaFiles()
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var fileStorage = scope.ServiceProvider.GetRequiredService<IFileStorage>();

        var cutoffDate = DateTime.UtcNow.AddHours(-24);
        var unusedFiles = await context.MediaFiles
            .Where(m => m.ReferenceCount <= 0 && m.CreatedAt < cutoffDate)
            .ToListAsync();

        if (unusedFiles.Count == 0)
        {
            return;
        }

        var deletedCount = 0;

        foreach (var mediaFile in unusedFiles)
        {
            var folderPath = GetFolderPathForCleanup(mediaFile);

            var deleteResult = await fileStorage.DeleteFileAsync(mediaFile.PublicId, folderPath);

            if (deleteResult.IsSuccess)
            {
                context.MediaFiles.Remove(mediaFile);
                deletedCount++;
            }
        }

        if (deletedCount > 0)
        {
            await context.SaveChangesAsync();
        }
    }

    private static string GetFolderPathForCleanup(MediaFile mediaFile)
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