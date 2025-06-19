using Application.Roles.DTOs;

namespace Application.ChatRoomRoles.DTOs;

public class MemberRoleDto
{
    public required string UserId { get; set; }
    public required string UserDisplayName { get; set; }
    public string? UserImageUrl { get; set; }
    public List<ChatRoomRoleDto> Roles { get; set; } = [];
    public DateTime DateJoined { get; set; }
}
