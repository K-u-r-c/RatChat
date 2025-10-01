using Application.ChatRooms.DTOs;
using Application.ChatRooms.Helpers;
using Application.Core;
using Application.Interfaces;
using AutoMapper;
using Domain;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore.Storage;
using Persistance;

namespace Application.ChatRooms.Commands;

public class CreateChatRoom
{
    public class Command : IRequest<Result<ChatRoomIdentifierDto>>
    {
        public required CreateChatRoomDto CreateChatRoomDto { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor,
        IMapper mapper,
        IChatRoomRoleService chatRoomRoleService)
        : IRequestHandler<Command, Result<ChatRoomIdentifierDto>>
    {
        public async Task<Result<ChatRoomIdentifierDto>> Handle(
            Command request,
            CancellationToken cancellationToken)
        {
            User user = await userAccessor.GetUserAsync();

            ChatRoom? chatRoom = mapper.Map<ChatRoom>(request.CreateChatRoomDto);
            chatRoom.OwnerId = user.Id;
            chatRoom.Slug = await ChatRoomSlugGenerator.GenerateUniqueSlugAsync(
                context,
                cancellationToken: cancellationToken);

            ChatRoomMember member = new()
            {
                ChatRoomId = chatRoom.Id,
                UserId = user.Id,
                IsOwner = true
            };

            chatRoom.Members.Add(member);

            chatRoom.Channels.Add(new ChatChannel
            {
                ChatRoomId = chatRoom.Id,
                Name = "general",
                Type = ChatChannelType.Text,
                Position = 0
            });

            chatRoom.Channels.Add(new ChatChannel
            {
                ChatRoomId = chatRoom.Id,
                Name = "General",
                Type = ChatChannelType.Voice,
                Position = 0
            });

            await using IDbContextTransaction transaction =
                await context.Database.BeginTransactionAsync(cancellationToken);

            context.ChatRooms.Add(chatRoom);

            bool created = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!created)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result<ChatRoomIdentifierDto>.Failure("Failed to create chat room", 400);
            }

            try
            {
                await chatRoomRoleService.InitializeDefaultRolesAsync(chatRoom.Id);
                await chatRoomRoleService.AssignMemberRoleAsync(user.Id, chatRoom.Id, cancellationToken);
            }
            catch (ChatRoomPermissionsNotFoundException ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result<ChatRoomIdentifierDto>.Failure(ex.Message, 500);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result<ChatRoomIdentifierDto>.Failure(ex.Message, 500);
            }
            catch (UserNotFoundException ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result<ChatRoomIdentifierDto>.Failure(ex.Message, 500);
            }
            catch (ChatRoomNotFoundException ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result<ChatRoomIdentifierDto>.Failure(ex.Message, 500);
            }

            await transaction.CommitAsync(cancellationToken);

            return Result<ChatRoomIdentifierDto>.Success(new ChatRoomIdentifierDto
            {
                Id = chatRoom.Id,
                Slug = chatRoom.Slug
            });
        }
    }
}