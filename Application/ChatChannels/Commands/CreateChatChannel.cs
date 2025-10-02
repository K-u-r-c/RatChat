using Application.ChatChannels.Helpers;
using Application.ChatRooms.DTOs;
using Application.Core;
using Application.Interfaces;
using AutoMapper;
using Domain;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.ChatChannels.Commands;

public class CreateChatChannel
{
    public class Command : IRequest<Result<ChatChannelDto>>
    {
        public required string ChatRoomId { get; set; }
        public required string Name { get; set; }
        public required string Type { get; set; }
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

            if (!Enum.TryParse<ChatChannelType>(request.Type, true, out var channelType))
                return Result<ChatChannelDto>.Failure("Invalid channel type", 400);

            var normalizedName = ChatChannelNameHelper.Normalize(request.Name, channelType);

            if (string.IsNullOrWhiteSpace(normalizedName))
                return Result<ChatChannelDto>.Failure("Channel name cannot be empty", 400);

            var nameAlreadyTaken = await context.ChatChannels
                .AnyAsync(
                    c => c.ChatRoomId == chatRoom.Id && c.Name == normalizedName,
                    cancellationToken);

            if (nameAlreadyTaken)
                return Result<ChatChannelDto>.Failure("A channel with this name already exists", 409);

            var maxPosition = await context.ChatChannels
                .Where(c => c.ChatRoomId == chatRoom.Id && c.Type == channelType)
                .Select(c => (int?)c.Position)
                .MaxAsync(cancellationToken);

            var nextPosition = (maxPosition ?? -1) + 1;

            var channel = new ChatChannel
            {
                ChatRoomId = chatRoom.Id,
                Name = normalizedName,
                Type = channelType,
                Position = nextPosition
            };

            context.ChatChannels.Add(channel);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;
            if (!result)
                return Result<ChatChannelDto>.Failure("Failed to create channel", 400);

            return Result<ChatChannelDto>.Success(mapper.Map<ChatChannelDto>(channel));
        }
    }
}
