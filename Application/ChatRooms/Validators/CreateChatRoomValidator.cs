using Application.ChatRooms.Commands;
using Application.ChatRooms.DTOs;

namespace Application.ChatRooms.Validators;

public class CreateChatRoomValidator : BaseChatRoomValidator<CreateChatRoom.Command, CreateChatRoomDto>
{
    public CreateChatRoomValidator() : base(x => x.CreateChatRoomDto) { }
}
