using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddChatRoomBackground : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatAppearances",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ChatType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ChatId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DefaultEmoji = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    BackgroundKey = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UpdatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatAppearances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatAppearances_AspNetUsers_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatAppearances_ChatType_ChatId",
                table: "ChatAppearances",
                columns: new[] { "ChatType", "ChatId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatAppearances_UpdatedByUserId",
                table: "ChatAppearances",
                column: "UpdatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatAppearances");
        }
    }
}
