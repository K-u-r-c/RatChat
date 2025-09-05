using Application.ChatRooms.DTOs;
using Application.ChatAppearances.DTOs;
using Application.DirectChats.DTOs;
using Application.EncryptedDirectChats.DTOs;
using Application.EncryptedDirectMessages.DTOs;
using Application.DirectMessages.DTOs;
using Application.EmojiPreferences.DTOs;
using Application.Friends.DTOs;
using Application.Messages.DTOs;
using Application.Profiles.DTOs;
using AutoMapper;
using Domain;
using Domain.Extensions;

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
                d => d.OwnerDisplayName,
                o => o.MapFrom(s => s.Members.FirstOrDefault(x => x.IsOwner)!.User.DisplayName)
            )
            .ForMember(
                d => d.OwnerId,
                o => o.MapFrom(s => s.Members.FirstOrDefault(x => x.IsOwner)!.User.Id)
            );

        CreateMap<ChatRoomMember, UserProfileDto>()
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.User.DisplayName))
            .ForMember(d => d.Bio, o => o.MapFrom(s => s.User.Bio))
            .ForMember(d => d.Id, o => o.MapFrom(s => s.User.Id))
            .ForMember(d => d.Slug, o => o.MapFrom(s => s.User.Slug))
            .ForMember(d => d.Tag, o => o.MapFrom(s => s.User.Tag))
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
                o => o.MapFrom(s => s.User.Status.IsConsideredOnline())
            )
            .ForMember(d => d.LastSeen, o => o.MapFrom(s => s.User.LastSeen))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.User.Status.ToString()));

        CreateMap<User, UserProfileDto>()
            .ForMember(d => d.Tag, o => o.MapFrom(s => s.Tag))
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
                o => o.MapFrom(s => s.Status.IsConsideredOnline())
            )
            .ForMember(d => d.LastSeen, o => o.MapFrom(s => s.LastSeen))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()));


        CreateMap<Message, MessageDto>()
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.User.DisplayName))
            .ForMember(d => d.UserId, o => o.MapFrom(s => s.User.Id))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.User.ImageUrl))
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString()))
            .ForMember(d => d.MediaUrl, o => o.MapFrom(s => s.MediaUrl))
            .ForMember(d => d.MediaPublicId, o => o.MapFrom(s => s.MediaPublicId))
            .ForMember(d => d.MediaType, o => o.MapFrom(s => s.MediaType))
            .ForMember(d => d.MediaFileSize, o => o.MapFrom(s => s.MediaFileSize))
            .ForMember(d => d.MediaOriginalFileName, o => o.MapFrom(s => s.MediaOriginalFileName))
            .ForMember(d => d.ReplyToMessageId, o => o.MapFrom(s => s.ReplyToMessageId))
            .ForMember(d => d.ReplyToDisplayName, o => o.MapFrom(s => s.ReplyToMessage != null ? s.ReplyToMessage.User.DisplayName : null))
            .ForMember(d => d.ReplyToBody, o => o.MapFrom(s => s.ReplyToMessage != null ? s.ReplyToMessage.Body : null))
            .ForMember(d => d.ReplyToType, o => o.MapFrom(s => s.ReplyToMessage != null ? s.ReplyToMessage.Type.ToString() : null))
            .ForMember(d => d.ReplyToMediaOriginalFileName, o => o.MapFrom(s => s.ReplyToMessage != null ? s.ReplyToMessage.MediaOriginalFileName : null))
            .ForMember(d => d.Reactions, o => o.MapFrom(s => s.Reactions));

        CreateMap<DirectChat, DirectChatDto>()
            .ForMember(d => d.OtherUserId, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2Id : s.User1Id))
            .ForMember(d => d.OtherUserDisplayName, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.DisplayName : s.User1.DisplayName))
            .ForMember(d => d.OtherUserImageUrl, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.ImageUrl : s.User1.ImageUrl))
            .ForMember(d => d.Status, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.Status.ToString() : s.User1.Status.ToString()))
            .ForMember(d => d.IsOnline, o => o.MapFrom(s =>
                s.User1Id == currentUserId
                    ? s.User2.Status.IsConsideredOnline()
                    : s.User1.Status.IsConsideredOnline()
            ));

        CreateMap<DirectMessage, DirectMessageDto>()
            .ForMember(d => d.SenderDisplayName, o => o.MapFrom(s => s.Sender.DisplayName))
            .ForMember(d => d.SenderImageUrl, o => o.MapFrom(s => s.Sender.ImageUrl))
            .ForMember(d => d.IsOwnMessage, o => o.MapFrom(s => s.SenderId == currentUserId))
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString()))
            .ForMember(d => d.MediaUrl, o => o.MapFrom(s => s.MediaUrl))
            .ForMember(d => d.MediaPublicId, o => o.MapFrom(s => s.MediaPublicId))
            .ForMember(d => d.MediaType, o => o.MapFrom(s => s.MediaType))
            .ForMember(d => d.MediaFileSize, o => o.MapFrom(s => s.MediaFileSize))
            .ForMember(d => d.MediaOriginalFileName, o => o.MapFrom(s => s.MediaOriginalFileName))
            .ForMember(d => d.ReplyToMessageId, o => o.MapFrom(s => s.ReplyToDirectMessageId))
            .ForMember(d => d.ReplyToDisplayName, o => o.MapFrom(s => s.ReplyToDirectMessage != null ? s.ReplyToDirectMessage.Sender.DisplayName : null))
            .ForMember(d => d.ReplyToBody, o => o.MapFrom(s => s.ReplyToDirectMessage != null ? s.ReplyToDirectMessage.Body : null))
            .ForMember(d => d.ReplyToType, o => o.MapFrom(s => s.ReplyToDirectMessage != null ? s.ReplyToDirectMessage.Type.ToString() : null))
            .ForMember(d => d.ReplyToMediaOriginalFileName, o => o.MapFrom(s => s.ReplyToDirectMessage != null ? s.ReplyToDirectMessage.MediaOriginalFileName : null))
            .ForMember(d => d.Reactions, o => o.MapFrom(s => s.Reactions));

        CreateMap<UserFriend, FriendDto>()
            .ForMember(d => d.Id, o => o.MapFrom(s => s.Friend.Id))
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.Friend.DisplayName))
            .ForMember(d => d.Bio, o => o.MapFrom(s => s.Friend.Bio))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.Friend.ImageUrl))
            .ForMember(d => d.BannerUrl, o => o.MapFrom(s => s.Friend.BannerUrl))
            .ForMember(d => d.FriendsSince, o => o.MapFrom(s => s.FriendsSince))
            .ForMember(
                d => d.IsOnline,
                o => o.MapFrom(s => s.Friend.Status.IsConsideredOnline())
            )
            .ForMember(d => d.LastSeen, o => o.MapFrom(s => s.Friend.LastSeen))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Friend.Status.ToString()));

        CreateMap<FriendRequest, FriendRequestDto>()
            .ForMember(d => d.SenderDisplayName, o => o.MapFrom(s => s.Sender.DisplayName))
            .ForMember(d => d.SenderImageUrl, o => o.MapFrom(s => s.Sender.ImageUrl))
            .ForMember(d => d.ReceiverDisplayName, o => o.MapFrom(s => s.Receiver.DisplayName))
            .ForMember(d => d.ReceiverImageUrl, o => o.MapFrom(s => s.Receiver.ImageUrl))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()));

        CreateMap<EmojiPreference, EmojiPreferenceDto>();
        CreateMap<ChatAppearance, ChatAppearanceDto>();

        CreateMap<MessageReaction, MessageReactionDto>()
            .ForMember(d => d.MessageId, o => o.MapFrom(s => s.MessageId))
            .ForMember(d => d.Emoji, o => o.MapFrom(s => s.Emoji))
            .ForMember(d => d.UserId, o => o.MapFrom(s => s.UserId))
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.User.DisplayName))
            .ForMember(d => d.CreatedAt, o => o.MapFrom(s => s.CreatedAt));

        CreateMap<DirectMessageReaction, MessageReactionDto>()
            .ForMember(d => d.MessageId, o => o.MapFrom(s => s.DirectMessageId))
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.User.DisplayName ?? string.Empty));

        CreateMap<EncryptedDirectChat, EncryptedDirectChatDto>()
            .ForMember(d => d.OtherUserId, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2Id : s.User1Id))
            .ForMember(d => d.OtherUserDisplayName, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.DisplayName : s.User1.DisplayName))
            .ForMember(d => d.OtherUserSlug, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.Slug : s.User1.Slug))
            .ForMember(d => d.OtherUserImageUrl, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.ImageUrl : s.User1.ImageUrl))
            .ForMember(d => d.Status, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.Status.ToString() : s.User1.Status.ToString()))
            .ForMember(d => d.IsOnline, o => o.MapFrom(s =>
                s.User1Id == currentUserId
                    ? s.User2.Status.IsConsideredOnline()
                    : s.User1.Status.IsConsideredOnline()
            ))
            .ForMember(d => d.LastSeen, o => o.MapFrom(s =>
                s.User1Id == currentUserId ? s.User2.LastSeen : s.User1.LastSeen));

        CreateMap<EncryptedDirectMessage, EncryptedDirectMessageDto>()
            .ForMember(d => d.SenderDisplayName, o => o.MapFrom(s => s.Sender.DisplayName))
            .ForMember(d => d.SenderSlug, o => o.MapFrom(s => s.Sender.Slug))
            .ForMember(d => d.SenderImageUrl, o => o.MapFrom(s => s.Sender.ImageUrl))
            .ForMember(d => d.IsOwnMessage, o => o.MapFrom(s => s.SenderId == currentUserId))
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString()))
            .ForMember(d => d.ReplyToMessageId, o => o.MapFrom(s => s.ReplyToEncryptedDirectMessageId))
            .ForMember(d => d.ReplyToCipherText, o => o.MapFrom(s => s.ReplyToEncryptedDirectMessage != null ? s.ReplyToEncryptedDirectMessage.CipherText : null))
            .ForMember(d => d.ReplyToCipherTextMetadata, o => o.MapFrom(s => s.ReplyToEncryptedDirectMessage != null ? s.ReplyToEncryptedDirectMessage.CipherTextMetadata : null))
            .ForMember(d => d.ReplyToVersion, o => o.MapFrom(s => s.ReplyToEncryptedDirectMessage != null ? s.ReplyToEncryptedDirectMessage.Version : null))
            .ForMember(d => d.ReplyToSenderId, o => o.MapFrom(s => s.ReplyToEncryptedDirectMessage != null ? s.ReplyToEncryptedDirectMessage.SenderId : null))
            .ForMember(d => d.ReplyToSenderDisplayName, o => o.MapFrom(s => s.ReplyToEncryptedDirectMessage != null ? s.ReplyToEncryptedDirectMessage.Sender.DisplayName : null))
            .ForMember(d => d.Reactions, o => o.MapFrom(s => s.Reactions));

        CreateMap<EncryptedDirectMessageReaction, MessageReactionDto>()
            .ForMember(d => d.MessageId, o => o.MapFrom(s => s.EncryptedDirectMessageId))
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.User.DisplayName ?? string.Empty));
            .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.User.DisplayName ?? ""));

        CreateMap<ChatRoomBanDto, ChatRoomBan>();
        CreateMap<ChatRoomBan, ChatRoomBanDto>();
    }
}
