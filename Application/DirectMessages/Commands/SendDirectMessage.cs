using Application.Core;
using Application.DirectMessages.DTOs;
using Application.Interfaces;
using AutoMapper;
using Domain;
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
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<DirectMessageDto>>
    {
        public async Task<Result<DirectMessageDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Body))
                return Result<DirectMessageDto>.Failure("Can't send empty message", 422);

            var currentUser = await userAccessor.GetUserAsync();

            var directChat = await context.DirectChats
                .Include(dc => dc.Messages)
                .ThenInclude(m => m.Sender)
                .FirstOrDefaultAsync(dc => dc.Id == request.DirectChatId, cancellationToken);

            if (directChat == null)
                return Result<DirectMessageDto>.Failure("Direct chat not found", 404);

            if (directChat.User1Id != currentUser.Id && directChat.User2Id != currentUser.Id)
                return Result<DirectMessageDto>.Failure("Access denied", 403);

            var message = new DirectMessage
            {
                SenderId = currentUser.Id,
                DirectChatId = directChat.Id,
                Body = request.Body
            };

            directChat.Messages.Add(message);
            directChat.LastMessageAt = message.CreatedAt;
            directChat.LastMessageBody = message.Body;
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