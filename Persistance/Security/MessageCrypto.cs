using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace Persistance.Security;

public static class MessageCrypto
{
    private const string Prefix = "enc:v1:";

    // AES-GCM parameters
    private const int NonceSize = 12; // 96-bit nonce per NIST recommendation
    private const int TagSize = 16;   // 128-bit tag

    private static byte[]? _key;
    private static readonly object _lock = new();

    public static void Initialize(IConfiguration configuration)
    {
        if (_key != null) return;
        lock (_lock)
        {
            if (_key != null) return;

            // Prefer appsettings: MessageEncryption:Key
            var keyString = configuration["MessageEncryptionKey"];

            if (string.IsNullOrWhiteSpace(keyString))
            {
                throw new InvalidOperationException($"Missing required configuration 'MessageEncryption:Key' (or environment variable). Provide a 32-byte (256-bit) key before running the API.");
            }

            _key = TryDecodeBase64(keyString) ?? TryDecodeHex(keyString);
            if (_key is null || _key.Length != 32)
            {
                throw new InvalidOperationException($"Invalid encryption key. Provide 32 bytes (256-bit) key as Base64 or Hex in 'MessageEncryption:Key'.");
            }
        }
    }

    public static void EnsureInitialized()
    {
        if (_key != null) return;
        throw new InvalidOperationException("MessageCrypto is not initialized. Call MessageCrypto.Initialize(configuration) during startup.");
    }

    public static string Encrypt(string plaintext)
    {
        EnsureInitialized();
        if (plaintext is null) return string.Empty;

        var plainBytes = Encoding.UTF8.GetBytes(plaintext);
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var cipher = new byte[plainBytes.Length];
        var tag = new byte[TagSize];

        using var aes = new AesGcm(_key!, TagSize);
        aes.Encrypt(nonce, plainBytes, cipher, tag);

        var payload = new byte[NonceSize + TagSize + cipher.Length];
        Buffer.BlockCopy(nonce, 0, payload, 0, NonceSize);
        Buffer.BlockCopy(tag, 0, payload, NonceSize, TagSize);
        Buffer.BlockCopy(cipher, 0, payload, NonceSize + TagSize, cipher.Length);

        return Prefix + Convert.ToBase64String(payload);
    }

    public static string Decrypt(string stored)
    {
        EnsureInitialized();
        if (string.IsNullOrEmpty(stored)) return stored;

        if (!stored.StartsWith(Prefix, StringComparison.Ordinal))
        {
            return stored;
        }

        var b64 = stored.Substring(Prefix.Length);
        var payload = Convert.FromBase64String(b64);
        if (payload.Length < NonceSize + TagSize)
        {
            throw new FormatException("Encrypted payload too short.");
        }

        var nonce = new byte[NonceSize];
        var tag = new byte[TagSize];
        var cipher = new byte[payload.Length - NonceSize - TagSize];

        Buffer.BlockCopy(payload, 0, nonce, 0, NonceSize);
        Buffer.BlockCopy(payload, NonceSize, tag, 0, TagSize);
        Buffer.BlockCopy(payload, NonceSize + TagSize, cipher, 0, cipher.Length);

        var plain = new byte[cipher.Length];
        using var aes = new AesGcm(_key!, TagSize);
        aes.Decrypt(nonce, cipher, tag, plain);
        return Encoding.UTF8.GetString(plain);
    }

    private static byte[]? TryDecodeBase64(string input)
    {
        try { return Convert.FromBase64String(input.Trim()); }
        catch { return null; }
    }

    private static byte[]? TryDecodeHex(string input)
    {
        try
        {
            var s = input.Trim();
            if (s.StartsWith("0x", StringComparison.OrdinalIgnoreCase)) s = s[2..];
            if (s.Length % 2 != 0) return null;
            var bytes = new byte[s.Length / 2];
            for (int i = 0; i < bytes.Length; i++)
            {
                bytes[i] = Convert.ToByte(s.Substring(i * 2, 2), 16);
            }
            return bytes;
        }
        catch { return null; }
    }
}
