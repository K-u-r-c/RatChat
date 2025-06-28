using Application.ChatRoomRoles.DTOs;

namespace Application.Interfaces;

public interface IChatRoomRoleService
{
    Task InitializeDefaultRolesAsync(string chatRoomId);

    Task<ChatRoomRoleDto> CreateCustomRoleAsync(CreateChatRoomRoleDto createRoleDto);
    Task<List<ChatRoomRoleDto>> GetRolesAsync(string chatRoomId);
    Task<List<ChatRoomRoleDto>> GetRolesAsync(string chatRoomId, string userId);
    Task DeleteRoleAsync(string chatRoomRoleId);
    Task UpdateRoleAsync(UpdateChatRoomRoleDto updateRoleDto);
    Task<bool> IsDefaultRoleAsync(string chatRoomRoleId);

    Task AssignMemberRoleAsync(string userId, string chatRoomId);
    Task<MemberRoleDto> AssignRoleAsync(AssignChatRoomRoleDto assignRoleDto);
    Task UnassignRoleAsync(UnassignChatRoomRoleDto unassignRoleDto);
}
