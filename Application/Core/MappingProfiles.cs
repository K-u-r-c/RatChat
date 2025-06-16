using Application.ChatRooms.DTOs;
using Application.DirectMessages.DTOs;
using Application.Friends.DTOs;
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
        CreateMap<CreateChatRoomDto, ChatRoom>();
        CreateMap<EditChatRoomDto, ChatRoom>();
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
            .ForMember(d => d.BannerUrl, o => o.MapFrom(s => s.User.BannerUrl))
            .ForMember(
                d => d.FriendsCount,
                o => o.MapFrom(s => s.User.Friends.Count)
            )
            .ForMember(
                d => d.IsFriend,
                o => o.MapFrom(s => s.User.Friends.Any(x => x.FriendId == currentUserId))
            );
        CreateMap<User, UserProfileDto>()
            .ForMember(
                d => d.FriendsCount,
                o => o.MapFrom(s => s.Friends.Count)
            )
            .ForMember(
                d => d.IsFriend,
                o => o.MapFrom(s => s.Friends.Any(x => x.FriendId == currentUserId))
            );

        CreateMap<Message, MessageDto>()
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.User.DisplayName))
            .ForMember(d => d.UserId, o => o.MapFrom(s => s.User.Id))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.User.ImageUrl));

        CreateMap<UserFriend, FriendDto>()
            .ForMember(d => d.Id, o => o.MapFrom(s => s.Friend.Id))
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.Friend.DisplayName))
            .ForMember(d => d.Bio, o => o.MapFrom(s => s.Friend.Bio))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.Friend.ImageUrl))
            .ForMember(d => d.BannerUrl, o => o.MapFrom(s => s.Friend.BannerUrl))
            .ForMember(d => d.FriendsSince, o => o.MapFrom(s => s.FriendsSince));

        CreateMap<FriendRequest, FriendRequestDto>()
            .ForMember(d => d.SenderDisplayName, o => o.MapFrom(s => s.Sender.DisplayName))
            .ForMember(d => d.SenderImageUrl, o => o.MapFrom(s => s.Sender.ImageUrl))
            .ForMember(d => d.ReceiverDisplayName, o => o.MapFrom(s => s.Receiver.DisplayName))
            .ForMember(d => d.ReceiverImageUrl, o => o.MapFrom(s => s.Receiver.ImageUrl))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()));

        CreateMap<DirectMessage, DirectMessageDto>()
            .ForMember(d => d.SenderDisplayName, o => o.MapFrom(s => s.Sender.DisplayName))
            .ForMember(d => d.SenderImageUrl, o => o.MapFrom(s => s.Sender.ImageUrl))
            .ForMember(d => d.IsOwnMessage, o => o.MapFrom(s => s.SenderId == currentUserId));
    }
}
