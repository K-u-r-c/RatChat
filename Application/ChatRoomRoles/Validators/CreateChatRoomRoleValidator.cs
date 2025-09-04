using Application.ChatRoomRoles.Commands;
using FluentValidation;

namespace Application.ChatRoomRoles.Validators;

public class CreateChatRoomRoleValidator :
    AbstractValidator<CreateChatRoomRole.Command>
{
    public CreateChatRoomRoleValidator()
    {
        RuleFor(x => x.CreateChatRoomRoleDto.Name)
            .NotEmpty().WithMessage("Role name is required")
            .MaximumLength(50).WithMessage("Role name must not exceed 50 characters");

        RuleFor(x => x.CreateChatRoomRoleDto.ChatRoomId)
            .NotEmpty().WithMessage("ChatRoomId is required");

        RuleFor(x => x.CreateChatRoomRoleDto.Color)
            .NotEmpty().WithMessage("Color is required")
            .Matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
            .WithMessage("Color must be a valid hex code (e.g., #FFF or #FFFFFF)");
    }
}
