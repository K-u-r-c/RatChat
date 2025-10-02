using Application.ChatRoomRoles.Commands;
using FluentValidation;

namespace Application.ChatRoomRoles.Validators;

public class ReorderChatRoomRolesValidator : AbstractValidator<ReorderChatRoomRoles.Command>
{
    public ReorderChatRoomRolesValidator()
    {
        RuleFor(x => x.Dto)
            .NotNull().WithMessage("Payload is required");

        RuleFor(x => x.Dto.ChatRoomId)
            .NotEmpty().WithMessage("ChatRoomId is required");

        RuleFor(x => x.Dto.OrderedRoleIds)
            .NotEmpty().WithMessage("Provide at least one role id")
            .Must(ids => ids.Count == ids.Distinct().Count())
            .WithMessage("Role ids must be unique");
    }
}