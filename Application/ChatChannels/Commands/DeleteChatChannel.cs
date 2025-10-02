using Application.Core;
using Application.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.ChatChannels.Commands;

public class DeleteChatChannel
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string ChatRoomId { get; set; }
        public required string ChannelId { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor,
        IRolePermissionService rolePermissionService
    ) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var userId = userAccessor.GetUserId();

            var chatRoom = await context.ChatRooms
                .AsNoTracking()
                .FirstOrDefaultAsync(cr => cr.Id == request.ChatRoomId, cancellationToken);

            if (chatRoom == null)
                return Result<Unit>.Failure("Chat room not found", 404);

            var hasPermission = await rolePermissionService.HasPermissionAsync(
                userId,
                chatRoom.Id,
                ChatRoomPermissions.ManageChannels);

            if (!hasPermission)
                return Result<Unit>.Failure("You do not have permission to manage channels", 403);

            var channel = await context.ChatChannels
                .FirstOrDefaultAsync(
                    c => c.Id == request.ChannelId && c.ChatRoomId == chatRoom.Id,
                    cancellationToken);

            if (channel == null)
                return Result<Unit>.Failure("Channel not found", 404);

            if (channel.Type == ChatChannelType.Text)
            {
                var textChannelCount = await context.ChatChannels
                    .CountAsync(
                        c => c.ChatRoomId == chatRoom.Id && c.Type == ChatChannelType.Text,
                        cancellationToken);

                if (textChannelCount <= 1)
                    return Result<Unit>.Failure("At least one text channel is required", 400);
            }
            else if (channel.Type == ChatChannelType.Voice)
            {
                var voiceChannelCount = await context.ChatChannels
                    .CountAsync(
                        c => c.ChatRoomId == chatRoom.Id && c.Type == ChatChannelType.Voice,
                        cancellationToken);

                if (voiceChannelCount <= 1)
                    return Result<Unit>.Failure("At least one voice channel is required", 400);
            }

            var messageIds = await context.Messages
                .Where(m => m.ChatRoomId == chatRoom.Id && m.ChannelId == channel.Id)
                .Select(m => m.Id)
                .ToListAsync(cancellationToken);

            if (messageIds.Count > 0)
            {
                await context.Messages
                    .Where(m => m.ReplyToMessageId != null && messageIds.Contains(m.ReplyToMessageId!))
                    .ExecuteUpdateAsync(
                        setters => setters.SetProperty(m => m.ReplyToMessageId, (string?)null),
                        cancellationToken);

                await context.MessageReactions
                    .Where(r => messageIds.Contains(r.MessageId))
                    .ExecuteDeleteAsync(cancellationToken);

                await context.Messages
                    .Where(m => messageIds.Contains(m.Id))
                    .ExecuteDeleteAsync(cancellationToken);
            }

            context.ChatChannels.Remove(channel);

            var siblings = await context.ChatChannels
                .Where(c => c.ChatRoomId == chatRoom.Id && c.Type == channel.Type && c.Id != channel.Id)
                .OrderBy(c => c.Position)
                .ToListAsync(cancellationToken);

            for (var index = 0; index < siblings.Count; index++)
            {
                siblings[index].Position = index;
            }

            var saved = await context.SaveChangesAsync(cancellationToken) > 0;
            if (!saved)
                return Result<Unit>.Failure("Failed to delete channel", 400);

            return Result<Unit>.Success(Unit.Value);
        }
    }
}
