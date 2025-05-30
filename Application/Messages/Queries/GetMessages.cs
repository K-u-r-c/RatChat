using Application.Core;
using Application.Messages.DTOs;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Messages.Queries;

public class GetMessages
{
    public class Query : IRequest<Result<List<MessageDto>>>
    {
        public required string ChatRoomId { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, Result<List<MessageDto>>>
    {
        public async Task<Result<List<MessageDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            var messages = await context.Messages
                .Where(x => x.ChatRoomId == request.ChatRoomId)
                .OrderByDescending(x => x.CreatedAt)
                .ProjectTo<MessageDto>(mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);

            return Result<List<MessageDto>>.Success(messages);
        }
    }
}
