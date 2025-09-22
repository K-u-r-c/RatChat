using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddE2EEDataModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EncryptedDirectChats",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    User1Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    User2Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastActivityAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastMessageSenderId = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EncryptedDirectChats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EncryptedDirectChats_AspNetUsers_User1Id",
                        column: x => x.User1Id,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EncryptedDirectChats_AspNetUsers_User2Id",
                        column: x => x.User2Id,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "EncryptedDirectChatNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    EncryptedDirectChatId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UnreadCount = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EncryptedDirectChatNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EncryptedDirectChatNotifications_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EncryptedDirectChatNotifications_EncryptedDirectChats_EncryptedDirectChatId",
                        column: x => x.EncryptedDirectChatId,
                        principalTable: "EncryptedDirectChats",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "EncryptedDirectMessages",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CipherText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CipherTextMetadata = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Version = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    SenderId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    EncryptedDirectChatId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ReplyToEncryptedDirectMessageId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EncryptedDirectMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EncryptedDirectMessages_AspNetUsers_SenderId",
                        column: x => x.SenderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EncryptedDirectMessages_EncryptedDirectChats_EncryptedDirectChatId",
                        column: x => x.EncryptedDirectChatId,
                        principalTable: "EncryptedDirectChats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EncryptedDirectMessages_EncryptedDirectMessages_ReplyToEncryptedDirectMessageId",
                        column: x => x.ReplyToEncryptedDirectMessageId,
                        principalTable: "EncryptedDirectMessages",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "EncryptedDirectMessageReactions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    EncryptedDirectMessageId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Emoji = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    EmojiKey = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EncryptedDirectMessageReactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EncryptedDirectMessageReactions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EncryptedDirectMessageReactions_EncryptedDirectMessages_EncryptedDirectMessageId",
                        column: x => x.EncryptedDirectMessageId,
                        principalTable: "EncryptedDirectMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EncryptedDirectChatNotifications_EncryptedDirectChatId",
                table: "EncryptedDirectChatNotifications",
                column: "EncryptedDirectChatId");

            migrationBuilder.CreateIndex(
                name: "IX_EncryptedDirectChatNotifications_UserId_EncryptedDirectChatId",
                table: "EncryptedDirectChatNotifications",
                columns: new[] { "UserId", "EncryptedDirectChatId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EncryptedDirectChats_User1Id_User2Id",
                table: "EncryptedDirectChats",
                columns: new[] { "User1Id", "User2Id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EncryptedDirectChats_User2Id",
                table: "EncryptedDirectChats",
                column: "User2Id");

            migrationBuilder.CreateIndex(
                name: "IX_EncryptedDirectMessageReactions_EncryptedDirectMessageId_UserId_EmojiKey",
                table: "EncryptedDirectMessageReactions",
                columns: new[] { "EncryptedDirectMessageId", "UserId", "EmojiKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EncryptedDirectMessageReactions_UserId",
                table: "EncryptedDirectMessageReactions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EncryptedDirectMessages_EncryptedDirectChatId_CreatedAt",
                table: "EncryptedDirectMessages",
                columns: new[] { "EncryptedDirectChatId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EncryptedDirectMessages_ReplyToEncryptedDirectMessageId",
                table: "EncryptedDirectMessages",
                column: "ReplyToEncryptedDirectMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_EncryptedDirectMessages_SenderId",
                table: "EncryptedDirectMessages",
                column: "SenderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EncryptedDirectChatNotifications");

            migrationBuilder.DropTable(
                name: "EncryptedDirectMessageReactions");

            migrationBuilder.DropTable(
                name: "EncryptedDirectMessages");

            migrationBuilder.DropTable(
                name: "EncryptedDirectChats");
        }
    }
}
