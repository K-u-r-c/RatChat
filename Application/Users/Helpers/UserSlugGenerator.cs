using System.Security.Cryptography;
using Domain;
using Microsoft.EntityFrameworkCore;

namespace Application.Users.Helpers;

public static class UserSlugGenerator
{
    private const string Alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    private const int DefaultLength = 12;

    public static async Task<string> GenerateUniqueSlugAsync(
        IQueryable<User> usersQuery,
        string? excludeUserId = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(usersQuery);

        while (true)
        {
            var candidate = CreateRandomSlug();
            var exists = await usersQuery.AnyAsync(
                u => u.Slug == candidate && (excludeUserId == null || u.Id != excludeUserId),
                cancellationToken);

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
