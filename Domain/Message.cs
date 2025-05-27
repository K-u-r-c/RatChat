namespace Domain;

public class Message
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Body { get; set; }
    public DateTime Date { get; set; }
}
