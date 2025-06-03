using Application.Chats.Commands;
using Application.Chats.DTOs;

namespace Application.Chats.Validators;

public class CreateChatRoomValidator : BaseChatRoomValidator<CreateChatRoom.Command, CreateChatRoomDto>
{
    public CreateChatRoomValidator() : base(x => x.CreateChatRoomDto) { }
}
