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
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                },
                new()
                {
                UserId = users[1].Id,
                IsOwner = false,
                }
            ],
            },
            new ()
            {
            Title = "Trash chat",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Cheese lovers",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Stinky pipers",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                },
                new()
                {
                UserId = users[1].Id,
                IsOwner = false,
                }
            ]
            },
            new ()
            {
            Title = "Trafic enjoyers",
            OwnerId = users[1].Id,
            Members =
            [
                new()
                {
                UserId = users[1].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Palm oil eaters",
            OwnerId = users[1].Id,
            Members =
            [
                new()
                {
                UserId = users[1].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Trash chat",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Movie watchers",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Degenerates",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                },
                new()
                {
                UserId = users[1].Id,
                IsOwner = false,
                }
            ]
            },
            new ()
            {
            Title = "Magic rats",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Wonderfull world",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Mewtwo",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            }
            ,new ()
            {
            Title = "Charizard",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Torchick",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Turtwig",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Squirtle",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Bulbasaur",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Ratata",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            },
            new ()
            {
            Title = "Magnemite",
            OwnerId = users[0].Id,
            Members =
            [
                new()
                {
                UserId = users[0].Id,
                IsOwner = true,
                }
            ]
            }
        };

        context.ChatRooms.AddRange(chatRooms);

        await context.SaveChangesAsync();
    }
}
