using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationsModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatRoomNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ChatRoomId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UnreadCount = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatRoomNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatRoomNotifications_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatRoomNotifications_ChatRooms_ChatRoomId",
                        column: x => x.ChatRoomId,
                        principalTable: "ChatRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DirectChatNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DirectChatId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UnreadCount = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DirectChatNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DirectChatNotifications_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DirectChatNotifications_DirectChats_DirectChatId",
                        column: x => x.DirectChatId,
                        principalTable: "DirectChats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomNotifications_ChatRoomId",
                table: "ChatRoomNotifications",
                column: "ChatRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomNotifications_UserId_ChatRoomId",
                table: "ChatRoomNotifications",
                columns: new[] { "UserId", "ChatRoomId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DirectChatNotifications_DirectChatId",
                table: "DirectChatNotifications",
                column: "DirectChatId");

            migrationBuilder.CreateIndex(
                name: "IX_DirectChatNotifications_UserId_DirectChatId",
                table: "DirectChatNotifications",
                columns: new[] { "UserId", "DirectChatId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatRoomNotifications");

            migrationBuilder.DropTable(
                name: "DirectChatNotifications");
        }
    }
}
