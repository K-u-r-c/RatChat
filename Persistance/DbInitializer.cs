using Domain;
using Microsoft.AspNetCore.Identity;

namespace Persistance;

public class DbInitializer
{
    public static async Task SeedData(AppDbContext context, UserManager<User> userManager)
    {
        var users = new List<User>
        {
            new() {Id="jakub-id", DisplayName = "Jakub", UserName = "jakub@test.com", Email = "jakub@test.com"},
            new() {Id="jan-id",DisplayName = "Jan", UserName = "jan@test.com", Email = "jan@test.com"},
        };

        if (!userManager.Users.Any())
        {
            foreach (var user in users)
            {
                await userManager.CreateAsync(user, "Password123@");
            }
        }

        if (context.ChatRooms.Any()) return;

        var now = DateTime.Now;

        var chatRooms = new List<ChatRoom>
        {
            new ()
            {
            Title = "Sewers chat",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddMonths(-2),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-30),
                IsAdmin = true,
                },
                new()
                {
                UserId = users[1].Id,
                DateJoined = now.AddDays(-29),
                IsAdmin = false,
                }
            ]
            },
            new ()
            {
            Title = "Trash chat",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddMonths(-1).AddDays(-3),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-25),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Cheese lovers",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddMonths(-1).AddDays(-10),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-20),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Stinky pipers",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddMonths(-1).AddDays(-15),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-18),
                IsAdmin = true,
                },
                new()
                {
                UserId = users[1].Id,
                DateJoined = now.AddDays(-17),
                IsAdmin = false,
                }
            ]
            },
            new ()
            {
            Title = "Trafic enjoyers",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-20),
            Members =
            [
                new()
                {
                UserId = users[1].Id,
                DateJoined = now.AddDays(-16),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Palm oil eaters",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-18),
            Members =
            [
                new()
                {
                UserId = users[1].Id,
                DateJoined = now.AddDays(-15),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Trash chat",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-17),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-14),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Movie watchers",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-16),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-13),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Degenerates",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-15),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-12),
                IsAdmin = true,
                },
                new()
                {
                UserId = users[1].Id,
                DateJoined = now.AddDays(-11),
                IsAdmin = false,
                }
            ]
            },
            new ()
            {
            Title = "Magic rats",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-14),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-10),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Wonderfull world",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-13),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-9),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Mewtwo",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-12),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-8),
                IsAdmin = true,
                }
            ]
            }
            ,new ()
            {
            Title = "Charizard",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-11),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-7),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Torchick",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-10),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-6),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Turtwig",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-9),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-5),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Squirtle",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-8),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-4),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Bulbasaur",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-7),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-3),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Ratata",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-6),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-2),
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Magnemite",
            JoinKey = Guid.NewGuid().ToString("N")[..16],
            Date = now.AddDays(-5),
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                DateJoined = now.AddDays(-1),
                IsAdmin = true,
                }
            ]
            }
        };

        context.ChatRooms.AddRange(chatRooms);

        await context.SaveChangesAsync();
    }
}
