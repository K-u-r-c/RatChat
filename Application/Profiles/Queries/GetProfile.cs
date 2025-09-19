using Application.Core;
using Application.Interfaces;
using Application.Profiles.DTOs;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Profiles.Queries;

public class GetProfile
{
    public class Query : IRequest<Result<UserProfileDto>>
    {
        public required string Identifier { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor)
        : IRequestHandler<Query, Result<UserProfileDto>>
    {
        public async Task<Result<UserProfileDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var user = await context.Users
                .Where(x => x.Id == request.Identifier || x.Slug == request.Identifier)
                .ProjectTo<UserProfileDto>(
                    mapper.ConfigurationProvider,
                    new { currentUserId = userAccessor.GetUserId() }
                )
                .SingleOrDefaultAsync(cancellationToken);

            if (user == null)
                return Result<UserProfileDto>.Failure("User not found", 404);

            return Result<UserProfileDto>.Success(user);
        }
    }
}