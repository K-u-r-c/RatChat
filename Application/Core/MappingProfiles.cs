using Application.ChatRooms.DTOs;
using Application.DirectChats.DTOs;
using Application.DirectMessages.DTOs;
using Application.Friends.DTOs;
using Application.Messages.DTOs;
using Application.Profiles.DTOs;
using AutoMapper;
using Domain;
using Domain.Enums;

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
            )
            .ForMember(
                d => d.IsOnline,
                o => o.MapFrom(s => s.User.Status == UserStatus.Online ||
                                   s.User.Status == UserStatus.Away ||
                                   s.User.Status == UserStatus.DoNotDisturb)
            )
            .ForMember(d => d.LastSeen, o => o.MapFrom(s => s.User.LastSeen))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.User.Status.ToString()))
            .ForMember(d => d.CustomStatusMessage, o => o.MapFrom(s => s.User.CustomStatusMessage));

        CreateMap<User, UserProfileDto>()
            .ForMember(
                d => d.FriendsCount,
                o => o.MapFrom(s => s.Friends.Count)
            )
            .ForMember(
                d => d.IsFriend,
                o => o.MapFrom(s => s.Friends.Any(x => x.FriendId == currentUserId))
            )
            .ForMember(
                d => d.IsOnline,
                o => o.MapFrom(s => s.Status == UserStatus.Online ||
                                   s.Status == UserStatus.Away ||
                                   s.Status == UserStatus.DoNotDisturb)
            )
            .ForMember(d => d.LastSeen, o => o.MapFrom(s => s.LastSeen))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.CustomStatusMessage, o => o.MapFrom(s => s.CustomStatusMessage));

        CreateMap<Message, MessageDto>()
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.User.DisplayName))
            .ForMember(d => d.UserId, o => o.MapFrom(s => s.User.Id))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.User.ImageUrl))
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString()))
            .ForMember(d => d.MediaUrl, o => o.MapFrom(s => s.MediaUrl))
            .ForMember(d => d.MediaPublicId, o => o.MapFrom(s => s.MediaPublicId))
            .ForMember(d => d.MediaType, o => o.MapFrom(s => s.MediaType))
            .ForMember(d => d.MediaFileSize, o => o.MapFrom(s => s.MediaFileSize))
            .ForMember(d => d.MediaOriginalFileName, o => o.MapFrom(s => s.MediaOriginalFileName));

        CreateMap<DirectChat, DirectChatDto>()
            .ForMember(d => d.OtherUserId, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2Id : s.User1Id))
            .ForMember(d => d.OtherUserDisplayName, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.DisplayName : s.User1.DisplayName))
            .ForMember(d => d.OtherUserImageUrl, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.ImageUrl : s.User1.ImageUrl))
            .ForMember(d => d.Status, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.Status.ToString() : s.User1.Status.ToString()))
            .ForMember(d => d.CustomStatusMessage, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.CustomStatusMessage : s.User1.CustomStatusMessage))
            .ForMember(d => d.IsOnline, o => o.MapFrom(s =>
                s.User1Id == currentUserId
                    ? (
                        s.User2.Status == UserStatus.Online ||
                        s.User2.Status == UserStatus.Away ||
                        s.User2.Status == UserStatus.DoNotDisturb
                    )
                    : (
                        s.User1.Status == UserStatus.Online ||
                        s.User1.Status == UserStatus.Away ||
                        s.User1.Status == UserStatus.DoNotDisturb
                    )
                )
            );

        CreateMap<DirectMessage, DirectMessageDto>()
            .ForMember(d => d.SenderDisplayName, o => o.MapFrom(s => s.Sender.DisplayName))
            .ForMember(d => d.SenderImageUrl, o => o.MapFrom(s => s.Sender.ImageUrl))
            .ForMember(d => d.IsOwnMessage, o => o.MapFrom(s => s.SenderId == currentUserId))
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString()))
            .ForMember(d => d.MediaUrl, o => o.MapFrom(s => s.MediaUrl))
            .ForMember(d => d.MediaPublicId, o => o.MapFrom(s => s.MediaPublicId))
            .ForMember(d => d.MediaType, o => o.MapFrom(s => s.MediaType))
            .ForMember(d => d.MediaFileSize, o => o.MapFrom(s => s.MediaFileSize))
            .ForMember(d => d.MediaOriginalFileName, o => o.MapFrom(s => s.MediaOriginalFileName));

        CreateMap<UserFriend, FriendDto>()
            .ForMember(d => d.Id, o => o.MapFrom(s => s.Friend.Id))
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.Friend.DisplayName))
            .ForMember(d => d.Bio, o => o.MapFrom(s => s.Friend.Bio))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.Friend.ImageUrl))
            .ForMember(d => d.BannerUrl, o => o.MapFrom(s => s.Friend.BannerUrl))
            .ForMember(d => d.FriendsSince, o => o.MapFrom(s => s.FriendsSince))
            .ForMember(
                d => d.IsOnline,
                o => o.MapFrom(s => s.Friend.Status == UserStatus.Online ||
                                   s.Friend.Status == UserStatus.Away ||
                                   s.Friend.Status == UserStatus.DoNotDisturb)
            )
            .ForMember(d => d.LastSeen, o => o.MapFrom(s => s.Friend.LastSeen))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Friend.Status.ToString()))
            .ForMember(d => d.CustomStatusMessage, o => o.MapFrom(s => s.Friend.CustomStatusMessage));

        CreateMap<FriendRequest, FriendRequestDto>()
            .ForMember(d => d.SenderDisplayName, o => o.MapFrom(s => s.Sender.DisplayName))
            .ForMember(d => d.SenderImageUrl, o => o.MapFrom(s => s.Sender.ImageUrl))
            .ForMember(d => d.ReceiverDisplayName, o => o.MapFrom(s => s.Receiver.DisplayName))
            .ForMember(d => d.ReceiverImageUrl, o => o.MapFrom(s => s.Receiver.ImageUrl))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()));
    }
}