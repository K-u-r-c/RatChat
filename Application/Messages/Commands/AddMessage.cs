using Application.Core;
using Application.Interfaces;
using Application.Messages.DTOs;
using AutoMapper;
using Domain;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Messages.Commands;

public class AddMessage
{
    public class Command : IRequest<Result<MessageDto>>
    {
        public required string Body { get; set; }
        public required string ChatRoomId { get; set; }
        public string Type { get; set; } = "Text";

        public string? MediaUrl { get; set; }
        public string? MediaPublicId { get; set; }
        public string? MediaType { get; set; }
        public long? MediaFileSize { get; set; }
        public string? MediaOriginalFileName { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<MessageDto>>
    {
        public async Task<Result<MessageDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            if (request.Type == "Text" && string.IsNullOrWhiteSpace(request.Body))
                return Result<MessageDto>.Failure("Can't send empty message", 422);

            if (request.Type != "Text" && string.IsNullOrEmpty(request.MediaUrl))
                return Result<MessageDto>.Failure("Media URL is required for media messages", 422);

            var chatRoom = await context.ChatRooms
                .Include(x => x.Messages)
                .ThenInclude(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == request.ChatRoomId, cancellationToken);

            if (chatRoom == null) return Result<MessageDto>.Failure("Could not find chat room", 404);

            var user = await userAccessor.GetUserAsync();

            if (!Enum.TryParse<MessageType>(request.Type, out var messageType))
                messageType = MessageType.Text;

            var message = new Message
            {
                UserId = user.Id,
                ChatRoomId = chatRoom.Id,
                Body = request.Body,
                Type = messageType,
                MediaUrl = request.MediaUrl,
                MediaPublicId = request.MediaPublicId,
                MediaType = request.MediaType,
                MediaFileSize = request.MediaFileSize,
                MediaOriginalFileName = request.MediaOriginalFileName
            };

            chatRoom.Messages.Add(message);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<MessageDto>.Success(mapper.Map<MessageDto>(message))
                : Result<MessageDto>.Failure("Failed to add message", 400);
        }
    }
}