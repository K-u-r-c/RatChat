using Application.ChatRooms.DTOs;
using Application.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Persistance;
using System.Linq;

namespace Application.ChatRooms.Commands;

public class JoinChatRoom
{
    public class Command : IRequest<Result<ChatRoomIdentifierDto>>
    {
        public required string Id { get; set; }
        public required string Token { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor, IChatRoomRoleService chatRoomRoleService)
        : IRequestHandler<Command, Result<ChatRoomIdentifierDto>>
    {
        public async Task<Result<ChatRoomIdentifierDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
            {
                return Result<ChatRoomIdentifierDto>.Failure("Join token is required", 400);
            }

            Domain.ChatRoomInvite? invite = null;
            string? chatRoomIdFromToken = null;
            DateTime? legacyExpiry = null;

            try
            {
                var decodedBytes = WebEncoders.Base64UrlDecode(request.Token);
                var decoded = System.Text.Encoding.UTF8.GetString(decodedBytes);
                var parts = decoded.Split(':');

                // New format: inviteId:secret
                if (parts.Length == 2)
                {
                    invite = await context.ChatRoomInvites
                        .FirstOrDefaultAsync(i => i.Id == parts[0] && i.Secret == parts[1], cancellationToken);

                    if (invite == null)
                    {
                        return Result<ChatRoomIdentifierDto>.Failure("Invalid join token", 401);
                    }

                    if (invite.Revoked)
                    {
                        return Result<ChatRoomIdentifierDto>.Failure("This invite has been revoked", 401);
                    }

                    if (invite.ExpiresAt.HasValue && invite.ExpiresAt.Value < DateTime.UtcNow)
                    {
                        return Result<ChatRoomIdentifierDto>.Failure("Join link has expired", 401);
                    }

                    chatRoomIdFromToken = invite.ChatRoomId;
                }
                // Legacy format: chatRoomId:randomToken:expires
                else if (parts.Length >= 3)
                {
                    chatRoomIdFromToken = parts[0];
                    var expiryString = string.Join(':', parts.Skip(2));
                    legacyExpiry = DateTime.Parse(expiryString, null, System.Globalization.DateTimeStyles.RoundtripKind);
                }
                else
                {
                    return Result<ChatRoomIdentifierDto>.Failure("Invalid join token", 401);
                }
            }
            catch
            {
                return Result<ChatRoomIdentifierDto>.Failure("Invalid join token", 401);
            }

            if (legacyExpiry.HasValue && legacyExpiry.Value < DateTime.UtcNow)
            {
                return Result<ChatRoomIdentifierDto>.Failure("Join link has expired", 401);
            }

            var chatRoomQuery = context.ChatRooms
                .Include(x => x.Members)
                .ThenInclude(x => x.User)
                .ThenInclude(x => x.Bans)
                .AsQueryable();

            ChatRoom? chatRoom = null;

            if (!string.IsNullOrWhiteSpace(chatRoomIdFromToken))
            {
                chatRoom = await chatRoomQuery.FirstOrDefaultAsync(
                    x => x.Id == chatRoomIdFromToken,
                    cancellationToken);
            }

            if (chatRoom == null)
            {
                chatRoom = await chatRoomQuery.FirstOrDefaultAsync(
                    x => x.Id == request.Id || x.Slug == request.Id,
                    cancellationToken);
            }

            if (chatRoom == null)
            {
                return Result<ChatRoomIdentifierDto>.Failure(
                    "Could not find this chat room or user is not part of the chat room",
                    404);
            }

            if (invite != null && invite.ChatRoomId != chatRoom.Id)
            {
                return Result<ChatRoomIdentifierDto>.Failure("Invalid join token", 401);
            }

            if (legacyExpiry.HasValue && !string.IsNullOrWhiteSpace(chatRoomIdFromToken) && chatRoom.Id != chatRoomIdFromToken)
            {
                return Result<ChatRoomIdentifierDto>.Failure("Invalid join token", 401);
            }

            var user = await userAccessor.GetUserAsync();
            var membership = chatRoom.Members.FirstOrDefault(x => x.UserId == user.Id);

            if (membership != null)
            {
                return Result<ChatRoomIdentifierDto>.Failure("User is already part of this chat room", 401);
            }

            var ban = chatRoom.Bans.FirstOrDefault(
                b => b.UserId == user.Id && b.ChatRoomId == chatRoom.Id);

            if (ban != null)
            {
                return Result<ChatRoomIdentifierDto>.Failure("User is banned from this chat room", 401);
            }

            if (invite != null)
            {
                if (!string.IsNullOrEmpty(invite.AllowedUserId) && invite.AllowedUserId != user.Id)
                {
                    return Result<ChatRoomIdentifierDto>.Failure("This invite is not for you", 403);
                }

                if (!string.IsNullOrEmpty(invite.AllowedUserId))
                {
                    invite.MaxUses = 1;
                }

                if (invite.MaxUses.HasValue && invite.Uses >= invite.MaxUses.Value)
                {
                    return Result<ChatRoomIdentifierDto>.Failure("This invite has reached its usage limit", 401);
                }

                invite.Uses += 1;
            }

            chatRoom.Members.Add(new ChatRoomMember
            {
                UserId = user.Id,
                ChatRoomId = chatRoom.Id,
                IsOwner = false
            });

            var saved = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!saved)
            {
                return Result<ChatRoomIdentifierDto>.Failure("Problem updating the DB", 400);
            }

            try
            {
                await chatRoomRoleService.AssignMemberRoleAsync(user.Id, chatRoom.Id, cancellationToken);
            }
            catch (Exception ex)
            {
                return Result<ChatRoomIdentifierDto>.Failure(ex.Message, 500);
            }

            return Result<ChatRoomIdentifierDto>.Success(new ChatRoomIdentifierDto
            {
                Id = chatRoom.Id,
                Slug = chatRoom.Slug
            });
        }
    }
}
