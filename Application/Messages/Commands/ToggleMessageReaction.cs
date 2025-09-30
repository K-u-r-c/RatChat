using Application.Core;
using Application.Interfaces;
using Application.Messages.DTOs;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Messages.Commands;

public class ToggleMessageReaction
{
    public class Command : IRequest<Result<ReactionUpdateDto>>
    {
        public required string ChatRoomId { get; set; }
        public required string MessageId { get; set; }
        public required string Emoji { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<ReactionUpdateDto>>
    {
        private static string BuildEmojiKey(string emoji)
        {
            if (string.IsNullOrEmpty(emoji)) return string.Empty;
            var codepoints = new List<int>();
            for (int i = 0; i < emoji.Length; i++)
            {
                int code = char.ConvertToUtf32(emoji, i);
                if (char.IsHighSurrogate(emoji[i])) i++;
                // Ignore VS16 only
                if (code == 0xFE0F) continue;
                codepoints.Add(code);
            }
            return string.Join("-", codepoints.Select(c => c.ToString("X")));
        }

        public async Task<Result<ReactionUpdateDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            var message = await context.Messages
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.Id == request.MessageId && m.ChatRoomId == request.ChatRoomId, cancellationToken);

            if (message == null)
                return Result<ReactionUpdateDto>.Failure("Message not found", 404);

            var isMember = await context.ChatRoomMembers
                .AsNoTracking()
                .AnyAsync(m => m.ChatRoomId == request.ChatRoomId && m.UserId == user.Id, cancellationToken);

            if (!isMember)
                return Result<ReactionUpdateDto>.Failure("User is not a member of this chat room", 403);

            var normalizedEmoji = request.Emoji.Trim();
            if (string.IsNullOrEmpty(normalizedEmoji))
                return Result<ReactionUpdateDto>.Failure("Invalid emoji", 400);

            var emojiKey = BuildEmojiKey(normalizedEmoji);
            if (string.IsNullOrEmpty(emojiKey))
                return Result<ReactionUpdateDto>.Failure("Invalid emoji", 400);

            var existing = await context.MessageReactions
                .FirstOrDefaultAsync(r =>
                    r.MessageId == request.MessageId && r.UserId == user.Id &&
                    (r.EmojiKey == emojiKey || (r.EmojiKey == "" && r.Emoji == normalizedEmoji)), cancellationToken);

            ReactionUpdateDto resultDto;

            if (existing != null)
            {
                if (string.IsNullOrEmpty(existing.EmojiKey))
                {
                    existing.EmojiKey = emojiKey;
                }
                context.MessageReactions.Remove(existing);
                await context.SaveChangesAsync(cancellationToken);

                resultDto = new ReactionUpdateDto
                {
                    Action = "removed",
                    ChatRoomId = request.ChatRoomId,
                    ChannelId = message.ChannelId,
                    MessageId = request.MessageId,
                    Emoji = normalizedEmoji,
                    UserId = user.Id,
                    DisplayName = user.DisplayName ?? "Unknown",
                    CreatedAt = existing.CreatedAt
                };
                return Result<ReactionUpdateDto>.Success(resultDto);
            }
            else
            {
                var reaction = new MessageReaction
                {
                    MessageId = request.MessageId,
                    UserId = user.Id,
                    Emoji = normalizedEmoji,
                    EmojiKey = emojiKey
                };
                context.MessageReactions.Add(reaction);
                await context.SaveChangesAsync(cancellationToken);

                resultDto = new ReactionUpdateDto
                {
                    Action = "added",
                    ChatRoomId = request.ChatRoomId,
                    ChannelId = message.ChannelId,
                    MessageId = request.MessageId,
                    Emoji = normalizedEmoji,
                    UserId = user.Id,
                    DisplayName = user.DisplayName ?? "Unknown",
                    CreatedAt = reaction.CreatedAt
                };
                return Result<ReactionUpdateDto>.Success(resultDto);
            }
        }
    }
}
