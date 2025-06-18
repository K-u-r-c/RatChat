using Application.Core;
using Application.DirectMessages.DTOs;
using Application.Interfaces;
using AutoMapper;
using Domain;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.DirectMessages.Commands;

public class SendDirectMessage
{
    public class Command : IRequest<Result<DirectMessageDto>>
    {
        public required string Body { get; set; }
        public required string DirectChatId { get; set; }
        public string Type { get; set; } = "Text";

        public string? MediaUrl { get; set; }
        public string? MediaPublicId { get; set; }
        public string? MediaType { get; set; }
        public long? MediaFileSize { get; set; }
        public string? MediaOriginalFileName { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<DirectMessageDto>>
    {
        public async Task<Result<DirectMessageDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            if (request.Type == "Text" && string.IsNullOrWhiteSpace(request.Body))
                return Result<DirectMessageDto>.Failure("Can't send empty message", 422);

            if (request.Type != "Text" && string.IsNullOrEmpty(request.MediaUrl))
                return Result<DirectMessageDto>.Failure("Media URL is required for media messages", 422);

            var currentUser = await userAccessor.GetUserAsync();

            var directChat = await context.DirectChats
                .Include(dc => dc.Messages)
                .ThenInclude(m => m.Sender)
                .FirstOrDefaultAsync(dc => dc.Id == request.DirectChatId, cancellationToken);

            if (directChat == null)
                return Result<DirectMessageDto>.Failure("Direct chat not found", 404);

            if (directChat.User1Id != currentUser.Id && directChat.User2Id != currentUser.Id)
                return Result<DirectMessageDto>.Failure("Access denied", 403);

            var otherUserId = directChat.User1Id == currentUser.Id ? directChat.User2Id : directChat.User1Id;
            var areFriends = await context.UserFriends
                .AnyAsync(uf =>
                    (uf.UserId == currentUser.Id && uf.FriendId == otherUserId) ||
                    (uf.UserId == otherUserId && uf.FriendId == currentUser.Id),
                    cancellationToken);

            if (!areFriends)
                return Result<DirectMessageDto>.Failure("You can only send messages to friends", 403);

            if (!Enum.TryParse<MessageType>(request.Type, out var messageType))
                messageType = MessageType.Text;

            var message = new DirectMessage
            {
                SenderId = currentUser.Id,
                DirectChatId = directChat.Id,
                Body = request.Body,
                Type = messageType,
                MediaUrl = request.MediaUrl,
                MediaPublicId = request.MediaPublicId,
                MediaType = request.MediaType,
                MediaFileSize = request.MediaFileSize,
                MediaOriginalFileName = request.MediaOriginalFileName
            };

            directChat.Messages.Add(message);
            directChat.LastMessageAt = message.CreatedAt;
            directChat.LastMessageBody = message.Type == MessageType.Text ? message.Body : $"📎 {message.MediaOriginalFileName}";
            directChat.LastMessageSenderId = message.SenderId;

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result)
                return Result<DirectMessageDto>.Failure("Failed to send message", 400);

            var messageDto = mapper.Map<DirectMessageDto>(message);
            messageDto.IsOwnMessage = true;

            return Result<DirectMessageDto>.Success(messageDto);
        }
    }
}