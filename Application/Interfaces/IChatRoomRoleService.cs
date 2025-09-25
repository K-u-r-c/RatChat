using Application.ChatRoomRoles.DTOs;

namespace Application.Interfaces;

public interface IChatRoomRoleService
{
    Task InitializeDefaultRolesAsync(string chatRoomId);

    Task<ChatRoomRoleDto> CreateCustomRoleAsync(CreateChatRoomRoleDto createRoleDto);
    Task<ChatRoomRoleDto> GetRoleAsync(string roleId);
    Task<List<ChatRoomRoleDto>> GetRolesAsync(string chatRoomId);
    Task<List<ChatRoomRoleDto>> GetRolesAsync(string chatRoomId, string userId);
    Task<Dictionary<string, List<ChatRoomRoleDto>>> GetUsersRolesAsync(string chatRoomId);
    Task UpdateRoleAsync(UpdateChatRoomRoleDto updateRoleDto);
    Task DeleteRoleAsync(string chatRoomRoleId);
    Task<bool> IsDefaultRoleAsync(string chatRoomRoleId);
    Task AssignMemberRoleAsync(string userId, string chatRoomId, CancellationToken cancellationToken);
    Task<AssignedChatRoomRoleDto> AssignRoleAsync(AssignChatRoomRoleDto assignRoleDto);
    Task<UnassignedChatRoomRoleDto> UnassignRoleAsync(UnassignChatRoomRoleDto unassignRoleDto);
    Task UnassignAllUserRolesAsync(string chatRoomId, string userId, CancellationToken cancellationToken);
}
