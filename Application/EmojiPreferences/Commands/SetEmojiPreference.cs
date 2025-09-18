using Application.Core;
using Application.EmojiPreferences.DTOs;
using Application.Interfaces;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.EmojiPreferences.Commands;

public class SetEmojiPreference
{
    public class Command : IRequest<Result<EmojiPreferenceDto>>
    {
        public required SetEmojiPreferenceDto SetEmojiPreferenceDto { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor, IMapper mapper)
        : IRequestHandler<Command, Result<EmojiPreferenceDto>>
    {
        public async Task<Result<EmojiPreferenceDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();
            var dto = request.SetEmojiPreferenceDto;

            if (dto.ChatType != "ChatRoom" && dto.ChatType != "DirectChat")
            {
                return Result<EmojiPreferenceDto>.Failure("Invalid chat type. Must be 'ChatRoom' or 'DirectChat'", 400);
            }

            if (string.IsNullOrWhiteSpace(dto.DefaultEmoji))
            {
                return Result<EmojiPreferenceDto>.Failure("Default emoji cannot be empty", 400);
            }

            if (dto.ChatType == "ChatRoom")
            {
                var hasAccess = await context.ChatRoomMembers
                    .AnyAsync(m => m.ChatRoomId == dto.ChatId && m.UserId == user.Id, cancellationToken);

                if (!hasAccess)
                {
                    return Result<EmojiPreferenceDto>.Failure("User does not have access to this chat room", 403);
                }
            }
            else if (dto.ChatType == "DirectChat")
            {
                var hasAccess = await context.DirectChats
                    .AnyAsync(dc => dc.Id == dto.ChatId &&
                                   (dc.User1Id == user.Id || dc.User2Id == user.Id), cancellationToken);

                if (!hasAccess)
                {
                    return Result<EmojiPreferenceDto>.Failure("User does not have access to this direct chat", 403);
                }
            }

            var existingPreference = await context.EmojiPreferences
                .FirstOrDefaultAsync(ep =>
                    ep.UserId == user.Id &&
                    ep.ChatType == dto.ChatType &&
                    ep.ChatId == dto.ChatId,
                    cancellationToken);

            EmojiPreference preference;

            if (existingPreference != null)
            {
                existingPreference.DefaultEmoji = dto.DefaultEmoji;
                existingPreference.UpdatedAt = DateTime.UtcNow;
                preference = existingPreference;
            }
            else
            {
                preference = new EmojiPreference
                {
                    UserId = user.Id,
                    ChatType = dto.ChatType,
                    ChatId = dto.ChatId,
                    DefaultEmoji = dto.DefaultEmoji
                };

                context.EmojiPreferences.Add(preference);
            }

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result)
            {
                return Result<EmojiPreferenceDto>.Failure("Failed to save emoji preference", 400);
            }

            return Result<EmojiPreferenceDto>.Success(mapper.Map<EmojiPreferenceDto>(preference));
        }
    }
}