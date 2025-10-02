using System;
using Application.ChatChannels.Helpers;
using Application.ChatRooms.DTOs;
using Application.Core;
using Application.Interfaces;
using AutoMapper;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.ChatChannels.Commands;

public class UpdateChatChannel
{
    public class Command : IRequest<Result<ChatChannelDto>>
    {
        public required string ChatRoomId { get; set; }
        public required string ChannelId { get; set; }
        public string? Name { get; set; }
        public int? Position { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor,
        IRolePermissionService rolePermissionService,
        IMapper mapper
    ) : IRequestHandler<Command, Result<ChatChannelDto>>
    {
        public async Task<Result<ChatChannelDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            var userId = userAccessor.GetUserId();

            var chatRoom = await context.ChatRooms
                .AsNoTracking()
                .FirstOrDefaultAsync(cr => cr.Id == request.ChatRoomId, cancellationToken);

            if (chatRoom == null)
                return Result<ChatChannelDto>.Failure("Chat room not found", 404);

            var hasPermission = await rolePermissionService.HasPermissionAsync(
                userId,
                chatRoom.Id,
                ChatRoomPermissions.ManageChannels);

            if (!hasPermission)
                return Result<ChatChannelDto>.Failure("You do not have permission to manage channels", 403);

            var channel = await context.ChatChannels
                .FirstOrDefaultAsync(
                    c => c.Id == request.ChannelId && c.ChatRoomId == chatRoom.Id,
                    cancellationToken);

            if (channel == null)
                return Result<ChatChannelDto>.Failure("Channel not found", 404);

            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                var normalizedName = ChatChannelNameHelper.Normalize(request.Name, channel.Type);

                if (string.IsNullOrWhiteSpace(normalizedName))
                    return Result<ChatChannelDto>.Failure("Channel name cannot be empty", 400);

                var nameAlreadyTaken = await context.ChatChannels
                    .AnyAsync(
                        c => c.ChatRoomId == chatRoom.Id && c.Id != channel.Id && c.Name == normalizedName,
                        cancellationToken);

                if (nameAlreadyTaken)
                    return Result<ChatChannelDto>.Failure("A channel with this name already exists", 409);

                channel.Name = normalizedName;
            }

            if (request.Position.HasValue)
            {
                var siblings = await context.ChatChannels
                    .Where(c => c.ChatRoomId == chatRoom.Id && c.Type == channel.Type)
                    .OrderBy(c => c.Position)
                    .ToListAsync(cancellationToken);

                var clampedPosition = Math.Clamp(request.Position.Value, 0, Math.Max(0, siblings.Count - 1));

                siblings.RemoveAll(c => c.Id == channel.Id);
                siblings.Insert(clampedPosition, channel);

                for (var index = 0; index < siblings.Count; index++)
                {
                    siblings[index].Position = index;
                }
            }

            var saved = await context.SaveChangesAsync(cancellationToken) > 0;
            if (!saved)
                return Result<ChatChannelDto>.Failure("Failed to update channel", 400);

            return Result<ChatChannelDto>.Success(mapper.Map<ChatChannelDto>(channel));
        }
    }
}
