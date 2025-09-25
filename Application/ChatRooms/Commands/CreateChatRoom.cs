using Application.ChatRooms.DTOs;
using Application.ChatRooms.Helpers;
using Application.Core;
using Application.Interfaces;
using AutoMapper;
using Domain;
using Domain.Enums;
using MediatR;
using Persistance;

namespace Application.ChatRooms.Commands;

public class CreateChatRoom
{
    public class Command : IRequest<Result<ChatRoomIdentifierDto>>
    {
        public required CreateChatRoomDto CreateChatRoomDto { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor, IMapper mapper)
        : IRequestHandler<Command, Result<ChatRoomIdentifierDto>>
    {
        public async Task<Result<ChatRoomIdentifierDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            var chatRoom = mapper.Map<ChatRoom>(request.CreateChatRoomDto);
            chatRoom.OwnerId = user.Id;
            chatRoom.Slug = await ChatRoomSlugGenerator.GenerateUniqueSlugAsync(
                context,
                cancellationToken: cancellationToken);

            context.ChatRooms.Add(chatRoom);

            var member = new ChatRoomMember
            {
                ChatRoomId = chatRoom.Id,
                UserId = user.Id,
                IsOwner = true
            };

            chatRoom.Members.Add(member);

            chatRoom.Channels.Add(new ChatChannel
            {
                ChatRoomId = chatRoom.Id,
                Name = "General",
                Type = ChatChannelType.Voice,
                Position = 0
            });

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result) return Result<ChatRoomIdentifierDto>.Failure("Failed to create chat room", 400);

            return Result<ChatRoomIdentifierDto>.Success(new ChatRoomIdentifierDto
            {
                Id = chatRoom.Id,
                Slug = chatRoom.Slug
            });
        }
    }
}
