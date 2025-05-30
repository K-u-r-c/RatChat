using Application.Chats.DTOs;
using Application.Messages.DTOs;
using Application.Profiles.DTOs;
using AutoMapper;
using Domain;

namespace Application.Core;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        string? currentUserId = null;

        CreateMap<ChatRoom, ChatRoom>();
        CreateMap<ChatRoom, UserChatRoomDto>();
        CreateMap<ChatRoom, ChatRoomDto>()
            .ForMember(
                d => d.AdminDisplayName,
                o => o.MapFrom(s => s.Members.FirstOrDefault(x => x.IsAdmin)!.User.DisplayName)
            )
            .ForMember(
                d => d.AdminId,
                o => o.MapFrom(s => s.Members.FirstOrDefault(x => x.IsAdmin)!.User.Id)
            );
        CreateMap<ChatRoomMember, UserProfileDto>()
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.User.DisplayName))
            .ForMember(d => d.Bio, o => o.MapFrom(s => s.User.Bio))
            .ForMember(d => d.Id, o => o.MapFrom(s => s.User.Id))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.User.ImageUrl))
            .ForMember(
                d => d.FollowersCount,
                o => o.MapFrom(s => s.User.Followers.Count)
            )
            .ForMember(
                d => d.FollowingCount,
                o => o.MapFrom(s => s.User.Followings.Count)
            )
            .ForMember(
                d => d.Following,
                o => o.MapFrom(s => s.User.Followers.Any(x => x.Observer.Id == currentUserId))
            );
        CreateMap<User, UserProfileDto>()
            .ForMember(
                d => d.FollowersCount,
                o => o.MapFrom(s => s.Followers.Count)
            )
            .ForMember(
                d => d.FollowingCount,
                o => o.MapFrom(s => s.Followings.Count)
            )
            .ForMember(
                d => d.Following,
                o => o.MapFrom(s => s.Followers.Any(x => x.Observer.Id == currentUserId))
            );
        CreateMap<Message, MessageDto>()
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.User.DisplayName))
            .ForMember(d => d.UserId, o => o.MapFrom(s => s.User.Id))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.User.ImageUrl));
    }
}
