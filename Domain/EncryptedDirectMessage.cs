using Domain.Enums;

namespace Domain;

public class EncryptedDirectMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string CipherText { get; set; }
    public string? CipherTextMetadata { get; set; }
    public string Version { get; set; } = "v1";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public MessageType Type { get; set; } = MessageType.Text;

    public required string SenderId { get; set; }
    public User Sender { get; set; } = null!;
    public required string EncryptedDirectChatId { get; set; }
    public EncryptedDirectChat EncryptedDirectChat { get; set; } = null!;

    public string? ReplyToEncryptedDirectMessageId { get; set; }
    public EncryptedDirectMessage? ReplyToEncryptedDirectMessage { get; set; }

    public ICollection<EncryptedDirectMessageReaction> Reactions { get; set; } = [];
}
