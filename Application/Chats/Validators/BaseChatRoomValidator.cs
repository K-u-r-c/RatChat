using Application.Chats.DTOs;
using FluentValidation;

namespace Application.Chats.Validators;

public class BaseChatRoomValidator<T, TDto> : AbstractValidator<T> where TDto : BaseChatRoomDto
{
    public BaseChatRoomValidator(Func<T, TDto> selector)
    {
        RuleFor(x => selector(x).Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(100).WithMessage("Title must not exceed 100 characters");
    }
}
