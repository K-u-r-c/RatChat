using Application.Friends.Commands;
using FluentValidation;

namespace Application.Friends.Validators;

public class SendFriendRequestValidator : AbstractValidator<SendFriendRequest.Command>
{
    public SendFriendRequestValidator()
    {
        RuleFor(x => x.SendFriendRequestDto.ReceiverId)
            .NotEmpty().WithMessage("ReceiverId is required");

        RuleFor(x => x.SendFriendRequestDto.Message)
            .MaximumLength(200).WithMessage("Message must not exceed 200 characters");
    }
}
