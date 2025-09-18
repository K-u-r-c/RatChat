using Application.Core;
using Application.EmojiPreferences.DTOs;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.EmojiPreferences.Queries;

public class GetEmojiPreference
{
    public class Query : IRequest<Result<EmojiPreferenceDto?>>
    {
        public required string ChatType { get; set; }
        public required string ChatId { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor, IMapper mapper)
        : IRequestHandler<Query, Result<EmojiPreferenceDto?>>
    {
        public async Task<Result<EmojiPreferenceDto?>> Handle(Query request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            var preference = await context.EmojiPreferences
                .FirstOrDefaultAsync(ep =>
                    ep.UserId == user.Id &&
                    ep.ChatType == request.ChatType &&
                    ep.ChatId == request.ChatId,
                    cancellationToken);

            if (preference == null)
            {
                return Result<EmojiPreferenceDto?>.Success(new EmojiPreferenceDto
                {
                    Id = "",
                    UserId = user.Id,
                    ChatType = request.ChatType,
                    ChatId = request.ChatId,
                    DefaultEmoji = "👍",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            return Result<EmojiPreferenceDto?>.Success(mapper.Map<EmojiPreferenceDto>(preference));
        }
    }
}