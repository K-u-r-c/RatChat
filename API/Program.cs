using API.Middleware;
using API.SignalR;
using Application.ChatRooms.Queries;
using Application.ChatRooms.Validators;
using Application.Core;
using Application.EmojiPreferences.Validators;
using Application.Development;
using Application.Friends.Validators;
using Application.Interfaces;
using Application.Profiles.Validators;
using Application.Status.Validators;
using Domain;
using FluentValidation;
using Infrastructure.Email;
using Infrastructure.Media;
using Infrastructure.Security;
using Infrastructure.Services;
using API.Services;
using Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Minio;
using Persistance;
using Resend;
using Application.ChatRoomRoles.Validators;
using Domain.Enums;
using API.SignalR.EventHandlers;
using Persistance.Security;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(opt =>
{
    var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
    opt.Filters.Add(new AuthorizeFilter(policy));
});
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddCors();
builder.Services.AddSignalR();
builder.Services.AddMediatR(x =>
{
    x.RegisterServicesFromAssemblyContaining<GetChatRoomList.Handler>();
    x.RegisterServicesFromAssemblyContaining<ChatRoomsProfileUpdateHandler>();
    x.AddOpenBehavior(typeof(ValidationBehavior<,>));
});
builder.Services.AddHttpClient<ResendClient>();
builder.Services.Configure<ResendClientOptions>(opt =>
{
    opt.ApiToken = builder.Configuration["Resend:ApiToken"]!;
});
builder.Services.AddTransient<IResend, ResendClient>();
builder.Services.AddTransient<IEmailSender<User>, EmailSender>();
builder.Services.AddScoped<IUserAccessor, UserAccessor>();
builder.Services.AddScoped<IMediaValidator, MediaValidator>();
builder.Services.AddScoped<IRolePermissionService, RolePermissionService>();
builder.Services.AddScoped<IChatRoomRoleService, ChatRoomRoleService>();
if (builder.Environment.IsDevelopment())
{
    // MinIO for development
    var minioConfig = builder.Configuration.GetSection("MinIO");
    builder.Services.AddSingleton(sp =>
        new MinioClient()
            .WithEndpoint(minioConfig["Endpoint"])
            .WithCredentials(minioConfig["AccessKey"], minioConfig["SecretKey"])
            .Build()
    );
    builder.Services.AddScoped<IFileStorage, MinioStorage>();
}
else
{
    // Azure Blob Storage for production / LEGACY / WE NOT USE MINIO FOR BOTH
    // builder.Services.AddSingleton(sp =>
    //     new BlobServiceClient(builder.Configuration.GetConnectionString("AzureStorage")));
    // builder.Services.AddScoped<IFileStorage, AzureBlobStorage>();

    // MinIO for production
    var minioConfig = builder.Configuration.GetSection("MinIO");
    builder.Services.AddSingleton(sp =>
        new MinioClient()
            .WithEndpoint(minioConfig["Endpoint"])
            .WithCredentials(minioConfig["AccessKey"], minioConfig["SecretKey"])
            .Build()
    );
    builder.Services.AddScoped<IFileStorage, MinioStorage>();
}
builder.Services.AddScoped<IFriendsNotificationService, FriendsNotificationService>();
builder.Services.AddScoped<IUserStatusService, UserStatusService>();
builder.Services.AddScoped<IStatusNotificationService, StatusNotificationService>();
builder.Services.AddScoped<IDirectMessagesNotificationService, DirectMessagesNotificationService>();
builder.Services.AddScoped<IEncryptedDirectMessagesNotificationService, EncryptedDirectMessagesNotificationService>();
builder.Services.AddScoped<IChatRoomsNotificationService, ChatRoomsNotificationService>();
builder.Services.AddAutoMapper(typeof(MappingProfiles).Assembly);
builder.Services.AddValidatorsFromAssemblyContaining<CreateChatRoomValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<UpdateProfileValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<SendFriendRequestValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<UpdateStatusValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<SetEmojiPreferenceValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<CreateChatRoomRoleValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<UpdateChatRoomRoleValidator>();
builder.Services.AddTransient<ExceptionMiddleware>();
builder.Services.AddHostedService<MediaCleanupService>();
builder.Services.AddIdentityApiEndpoints<User>(opt =>
{
    opt.User.RequireUniqueEmail = true;
    if (builder.Environment.IsProduction())
    {
        opt.SignIn.RequireConfirmedEmail = true;
    }
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<AppDbContext>();
builder.Services.AddAuthorization(opt =>
{
    opt.AddPolicy(IsAdminStrings.IsChatRoomAdmin, policy =>
    {
        policy.Requirements.Add(new IsAdminRequirement());
    });

    foreach (var permissionName in ChatRoomPermissions.All.Keys)
    {
        opt.AddPolicy(permissionName, policy =>
        {
            policy.Requirements.Add(
                new HasPermissionRequirement(permissionName));
        });
    }
});
builder.Services.AddTransient<IAuthorizationHandler, IsAdminRequirementHandler>();
builder.Services.AddTransient<IAuthorizationHandler, HasPermissionRequirementHandler>();
MessageCrypto.Initialize(builder.Configuration);

var clientAppOrigins = builder.Configuration["ClientAppUrl"]?
    .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
var corsOrigins = (clientAppOrigins is { Length: > 0 })
    ? clientAppOrigins
    : ["https://localhost:3000"];

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

app.UseCors(x => x
    .AllowAnyHeader()
    .AllowAnyMethod()
    .WithOrigins(corsOrigins)
    .AllowCredentials()
);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGroup("api").MapIdentityApi<User>();
app.MapHub<MessageHub>("/messages");
app.MapHub<FriendsHub>("/friends");
app.MapHub<DirectMessageHub>("/direct-messages");
app.MapHub<EncryptedDirectMessageHub>("/encrypted-direct-messages");
app.MapHub<EncryptedMessageHub>("/encrypted-messages");
app.MapHub<StatusHub>("/status");
app.MapHub<ChatRoomRolesHub>("/chatroom-roles");
app.MapHub<ChatRoomsProfileUpdateHub>("/chatroom-image-update");

using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;
try
{
    var context = services.GetRequiredService<AppDbContext>();
    var userManager = services.GetRequiredService<UserManager<User>>();
    var rolePermissionService = services.GetRequiredService<IRolePermissionService>();
    var chatRoomRoleService = services.GetRequiredService<IChatRoomRoleService>();
    await context.Database.MigrateAsync();

    if (builder.Environment.IsDevelopment())
    {
        await DbInitializer.SeedData(context, userManager, rolePermissionService, chatRoomRoleService);
    }
}
catch (Exception ex)
{
    var logger = services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "An error occurred during migration");
}
app.Run();
