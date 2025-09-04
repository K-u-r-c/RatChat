using Application.ChatRooms.DTOs;
using Application.Core;
using Application.Interfaces;
using AutoMapper;
using Domain;
using MediatR;
using Persistance;

namespace Application.ChatRooms.Commands;

public class CreateChatRoom
{
    public class Command : IRequest<Result<string>>
    {
        public required CreateChatRoomDto CreateChatRoomDto { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor, IMapper mapper)
        : IRequestHandler<Command, Result<string>>
    {
        public async Task<Result<string>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            var chatRoom = mapper.Map<ChatRoom>(request.CreateChatRoomDto);

            context.ChatRooms.Add(chatRoom);

            var member = new ChatRoomMember
            {
                ChatRoomId = chatRoom.Id,
                UserId = user.Id,
                IsOwner = true
            };

            chatRoom.Members.Add(member);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result) return Result<string>.Failure("Failed to create chat room", 400);

            return Result<string>.Success(chatRoom.Id);
        }
    }
}
