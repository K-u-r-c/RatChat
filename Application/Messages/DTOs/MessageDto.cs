namespace Application.Messages.DTOs;

public class MessageDto
{
    public required string Id { get; set; }
    public required string Body { get; set; }
    public DateTime Date { get; set; }
}
