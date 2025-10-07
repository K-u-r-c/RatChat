using Application.ChatRooms.DTOs;
using Application.ChatRooms.Events;
using Application.Core;
using Application.Interfaces;
using Domain.Enums;
using Domain.Events;
using MediatR;
using Persistance;

namespace Application.ChatRooms.Commands;

public class UpdateChatRoomImage
{
    public class Command : IRequest<Result<Unit>>
    {
        public required SetChatRoomImageDto Dto { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor,
        IRolePermissionService rolePermissionService,
        IPublisher publisher
    ) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var userId = userAccessor.GetUserId();

            var chatRoom = await context.ChatRooms
                .FindAsync([request.Dto.Id], cancellationToken);

            if (chatRoom == null) return Result<Unit>.Failure("Chat room not found", 404);

            var hasPermission = await rolePermissionService.HasPermissionAsync(
                userId,
                chatRoom.Id,
                ChatRoomPermissions.ChangeChatRoomImage);

            if (!hasPermission)
                return Result<Unit>.Failure("You do not have permission to change the chat room image", 403);

            chatRoom.ImageUrl = request.Dto.ImageUrl;
            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (result)
            {
                var domainEvent = new ChatRoomProfileImageUpdatedEvent
                {
                    ChatRoomId = chatRoom.Id,
                    ImageUrl = chatRoom.ImageUrl
                };

                await publisher.Publish(
                    new ChatRoomProfileImageUpdatedNotification(domainEvent),
                    cancellationToken
                );

                return Result<Unit>.Success(Unit.Value);
            }

            return Result<Unit>.Failure("Failed to update chat room image", 400);
        }
    }
}
