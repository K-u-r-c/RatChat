using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.ChatRooms.Helpers;

public static class ChatRoomSlugGenerator
{
    private const string Alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    private const int DefaultLength = 12;

    public static async Task<string> GenerateUniqueSlugAsync(
        AppDbContext context,
        string? excludeChatRoomId = null,
        ISet<string>? reservedSlugs = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        while (true)
        {
            var candidate = CreateRandomSlug();
            if (reservedSlugs?.Contains(candidate) ?? false)
            {
                continue;
            }

            var exists = await context.ChatRooms
                .AsNoTracking()
                .AnyAsync(x => x.Slug == candidate && x.Id != excludeChatRoomId, cancellationToken);

            if (!exists)
            {
                return candidate;
            }
        }
    }

    private static string CreateRandomSlug(int length = DefaultLength)
    {
        Span<byte> bytes = stackalloc byte[length];
        RandomNumberGenerator.Fill(bytes);

        Span<char> buffer = stackalloc char[length];
        for (var i = 0; i < length; i++)
        {
            buffer[i] = Alphabet[bytes[i] % Alphabet.Length];
        }

        return new string(buffer);
    }
}
