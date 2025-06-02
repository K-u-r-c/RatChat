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
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                },
                new()
                {
                UserId = users[1].Id,
                IsAdmin = false,
                }
            ]
            },
            new ()
            {
            Title = "Trash chat",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Cheese lovers",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Stinky pipers",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                },
                new()
                {
                UserId = users[1].Id,
                IsAdmin = false,
                }
            ]
            },
            new ()
            {
            Title = "Trafic enjoyers",
            Members =
            [
                new()
                {
                UserId = users[1].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Palm oil eaters",
            Members =
            [
                new()
                {
                UserId = users[1].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Trash chat",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Movie watchers",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Degenerates",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                },
                new()
                {
                UserId = users[1].Id,
                IsAdmin = false,
                }
            ]
            },
            new ()
            {
            Title = "Magic rats",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Wonderfull world",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Mewtwo",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            }
            ,new ()
            {
            Title = "Charizard",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Torchick",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Turtwig",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Squirtle",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Bulbasaur",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Ratata",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            },
            new ()
            {
            Title = "Magnemite",
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsAdmin = true,
                }
            ]
            }
        };

        context.ChatRooms.AddRange(chatRooms);

        await context.SaveChangesAsync();
    }
}
