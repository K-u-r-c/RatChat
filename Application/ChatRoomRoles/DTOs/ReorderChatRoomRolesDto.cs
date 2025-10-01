using System.Collections.Generic;

namespace Application.ChatRoomRoles.DTOs;

public class ReorderChatRoomRolesDto
{
    public required string ChatRoomId { get; set; }
    public List<string> OrderedRoleIds { get; set; } = [];
}
