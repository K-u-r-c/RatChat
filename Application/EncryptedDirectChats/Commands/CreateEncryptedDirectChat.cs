using Application.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.EncryptedDirectChats.Commands;

public class CreateEncryptedDirectChat
{
    public class Command : IRequest<Result<string>>
    {
        public required string OtherUserId { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<string>>
    {
        public async Task<Result<string>> Handle(Command request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();

            if (currentUser.Id == request.OtherUserId)
            {
                return Result<string>.Failure("Cannot create encrypted chat with yourself", 400);
            }

            var areFriends = await context.UserFriends
                .AnyAsync(uf =>
                    (uf.UserId == currentUser.Id && uf.FriendId == request.OtherUserId) ||
                    (uf.UserId == request.OtherUserId && uf.FriendId == currentUser.Id),
                    cancellationToken);

            if (!areFriends)
            {
                return Result<string>.Failure("Can only create encrypted chats with friends", 400);
            }

            var existingChat = await context.EncryptedDirectChats
                .FirstOrDefaultAsync(dc =>
                    (dc.User1Id == currentUser.Id && dc.User2Id == request.OtherUserId) ||
                    (dc.User1Id == request.OtherUserId && dc.User2Id == currentUser.Id),
                    cancellationToken);

            if (existingChat is not null)
            {
                return Result<string>.Success(existingChat.Id);
            }

            var ordered = string.CompareOrdinal(currentUser.Id, request.OtherUserId) <= 0
                ? (User1Id: currentUser.Id, User2Id: request.OtherUserId)
                : (User1Id: request.OtherUserId, User2Id: currentUser.Id);

            var encryptedChat = new EncryptedDirectChat
            {
                User1Id = ordered.User1Id,
                User2Id = ordered.User2Id,
                LastMessageSenderId = null,
                LastActivityAt = DateTime.UtcNow,
            };

            context.EncryptedDirectChats.Add(encryptedChat);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;
            if (!result)
            {
                return Result<string>.Failure("Failed to create encrypted chat", 400);
            }

            return Result<string>.Success(encryptedChat.Id);
        }
    }
}
