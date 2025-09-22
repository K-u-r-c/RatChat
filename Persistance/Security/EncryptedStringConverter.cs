using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Persistance.Security;

public sealed class EncryptedStringConverter : ValueConverter<string, string>
{
    public static readonly EncryptedStringConverter Instance = new();

    private EncryptedStringConverter()
        : base(
            v => v == null ? string.Empty : MessageCrypto.Encrypt(v),
            v => string.IsNullOrEmpty(v) ? v : MessageCrypto.Decrypt(v))
    { }
}
