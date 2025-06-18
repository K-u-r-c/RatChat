using Application.Core;
using Application.Interfaces;
using Application.Media.DTOs;
using Application.Media.Helpers;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Media.Commands;

public class DeleteMedia
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string PublicId { get; set; }
        public MediaCategory Category { get; set; }
        public string? ChatRoomId { get; set; }
        public string? ChannelId { get; set; }
        public bool ForceDelete { get; set; } = false;
    }

    public class Handler(
        IFileStorage fileStorage,
        IUserAccessor userAccessor,
        UserManager<User> userManager,
        AppDbContext context)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            if (MediaHelpers.IsChatRoomMedia(request.Category))
            {
                if (string.IsNullOrEmpty(request.ChatRoomId))
                    return Result<Unit>.Failure("ChatRoomId is required for chat room media", 400);

                var hasAccess = await context.ChatRoomMembers
                    .AnyAsync(m => m.ChatRoomId == request.ChatRoomId &&
                                  m.UserId == user.Id, cancellationToken);

                if (!hasAccess)
                    return Result<Unit>.Failure("User does not have access to this chat room", 403);
            }

            var mediaFile = await context.MediaFiles
                .FirstOrDefaultAsync(m => m.PublicId == request.PublicId, cancellationToken);

            if (mediaFile != null)
            {
                if (!MediaHelpers.IsChatRoomMedia(request.Category) && mediaFile.UploadedById != user.Id)
                {
                    return Result<Unit>.Failure("You do not have permission to delete this media file.", 403);
                }

                var folderPath = MediaHelpers.GetFolderPath(
                    request.Category,
                    user.Id,
                    request.ChatRoomId,
                    request.ChannelId);

                var deleteResult = await fileStorage.DeleteFileAsync(request.PublicId, folderPath);

                if (!deleteResult.IsSuccess && !request.ForceDelete)
                    return Result<Unit>.Failure(deleteResult.Error!, deleteResult.Code);

                context.MediaFiles.Remove(mediaFile);

                if (request.Category == MediaCategory.ProfileImage &&
                    user.ImageUrl?.Contains(request.PublicId) == true)
                {
                    user.ImageUrl = null;
                    await userManager.UpdateAsync(user);
                }

                await context.SaveChangesAsync(cancellationToken);
            }
            else
            {
                var folderPath = MediaHelpers.GetFolderPath(
                    request.Category,
                    user.Id,
                    request.ChatRoomId,
                    request.ChannelId);

                var deleteResult = await fileStorage.DeleteFileAsync(request.PublicId, folderPath);

                if (!deleteResult.IsSuccess)
                    return Result<Unit>.Failure(deleteResult.Error!, deleteResult.Code);
            }

            return Result<Unit>.Success(Unit.Value);
        }
    }
}