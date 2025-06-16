using Application.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.DirectChats.Commands;

public class CreateDirectChat
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
                return Result<string>.Failure("Cannot create chat with yourself", 400);

            var areFriends = await context.UserFriends
                .AnyAsync(uf =>
                    (uf.UserId == currentUser.Id && uf.FriendId == request.OtherUserId) ||
                    (uf.UserId == request.OtherUserId && uf.FriendId == currentUser.Id),
                    cancellationToken);

            if (!areFriends)
                return Result<string>.Failure("Can only create direct chats with friends", 400);

            var existingChat = await context.DirectChats
                .FirstOrDefaultAsync(dc =>
                    (dc.User1Id == currentUser.Id && dc.User2Id == request.OtherUserId) ||
                    (dc.User1Id == request.OtherUserId && dc.User2Id == currentUser.Id),
                    cancellationToken);

            if (existingChat != null)
                return Result<string>.Success(existingChat.Id);

            var directChat = new DirectChat
            {
                User1Id = string.Compare(currentUser.Id, request.OtherUserId, StringComparison.Ordinal) < 0
                    ? currentUser.Id
                    : request.OtherUserId,
                User2Id = string.Compare(currentUser.Id, request.OtherUserId, StringComparison.Ordinal) < 0
                    ? request.OtherUserId
                    : currentUser.Id
            };

            context.DirectChats.Add(directChat);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<string>.Success(directChat.Id)
                : Result<string>.Failure("Failed to create direct chat", 400);
        }
    }
}