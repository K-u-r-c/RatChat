using Application.Core;
using Application.EncryptedDirectMessages.DTOs;
using Application.Interfaces;
using AutoMapper;
using Domain;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.EncryptedDirectMessages.Commands;

public class SendEncryptedDirectMessage
{
    public class Command : IRequest<Result<EncryptedDirectMessageDto>>
    {
        public required string EncryptedDirectChatId { get; set; }
        public required string CipherText { get; set; }
        public string? CipherTextMetadata { get; set; }
        public string Version { get; set; } = "v1";
        public string Type { get; set; } = "Text";
        public string? ReplyToMessageId { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<EncryptedDirectMessageDto>>
    {
        public async Task<Result<EncryptedDirectMessageDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.CipherText))
            {
                return Result<EncryptedDirectMessageDto>.Failure("Cipher text is required", 422);
            }

            var currentUser = await userAccessor.GetUserAsync();

            var chat = await context.EncryptedDirectChats
                .Include(dc => dc.Messages)
                .FirstOrDefaultAsync(dc => dc.Id == request.EncryptedDirectChatId, cancellationToken);

            if (chat is null)
            {
                return Result<EncryptedDirectMessageDto>.Failure("Encrypted chat not found", 404);
            }

            if (chat.User1Id != currentUser.Id && chat.User2Id != currentUser.Id)
            {
                return Result<EncryptedDirectMessageDto>.Failure("Access denied", 403);
            }

            var otherUserId = chat.User1Id == currentUser.Id ? chat.User2Id : chat.User1Id;
            var areFriends = await context.UserFriends
                .AnyAsync(uf =>
                    (uf.UserId == currentUser.Id && uf.FriendId == otherUserId) ||
                    (uf.UserId == otherUserId && uf.FriendId == currentUser.Id),
                    cancellationToken);

            if (!areFriends)
            {
                return Result<EncryptedDirectMessageDto>.Failure("You can only send encrypted messages to friends", 403);
            }

            if (!Enum.TryParse<MessageType>(request.Type, out var messageType))
            {
                messageType = MessageType.Text;
            }

            var message = new EncryptedDirectMessage
            {
                SenderId = currentUser.Id,
                EncryptedDirectChatId = chat.Id,
                CipherText = request.CipherText,
                CipherTextMetadata = request.CipherTextMetadata,
                Version = string.IsNullOrWhiteSpace(request.Version) ? "v1" : request.Version,
                Type = messageType,
            };

            if (!string.IsNullOrEmpty(request.ReplyToMessageId))
            {
                var repliedTo = await context.EncryptedDirectMessages
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m => m.Id == request.ReplyToMessageId, cancellationToken);
                if (repliedTo is null || repliedTo.EncryptedDirectChatId != chat.Id)
                {
                    return Result<EncryptedDirectMessageDto>.Failure("Invalid replied message", 400);
                }
                message.ReplyToEncryptedDirectMessageId = repliedTo.Id;
            }

            chat.Messages.Add(message);
            chat.LastActivityAt = message.CreatedAt;
            chat.LastMessageSenderId = message.SenderId;

            var saved = await context.SaveChangesAsync(cancellationToken) > 0;
            if (!saved)
            {
                return Result<EncryptedDirectMessageDto>.Failure("Failed to send encrypted message", 400);
            }

            var dto = mapper.Map<EncryptedDirectMessageDto>(message);
            dto.IsOwnMessage = true;

            return Result<EncryptedDirectMessageDto>.Success(dto);
        }
    }
}
