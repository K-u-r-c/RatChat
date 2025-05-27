using Application.Core;
using Application.Messages.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Messages.Queries;

public class GetMessageList
{
    public class Query : IRequest<List<MessageDto>> { }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, List<MessageDto>>
    {
        public async Task<List<MessageDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var messages = await context.Messages.ToListAsync(cancellationToken);
            return mapper.Map<List<MessageDto>>(messages);
        }
    }
}
