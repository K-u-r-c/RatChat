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

        await context.SaveChangesAsync();
    }
}
