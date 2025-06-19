using Application.Roles.DTOs;

namespace Application.Interfaces;

public interface IChatRoomRoleService
{
    Task InitializeDefaultRolesAsync(string chatRoomId);

    Task<bool> CreateRoleAsync(ChatRoomRoleDto chatRoomRoleDto, string chatRoomId);
    Task<bool> DeleteRoleAsync(string chatRoomRoleId);

    Task AssignMemberRoleAsync(string userId, string chatRoomId);
}
