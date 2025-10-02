using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddBanAndKickModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatRoomMemberRoles_AspNetUsers_UserId",
                table: "ChatRoomMemberRoles");

            migrationBuilder.CreateTable(
                name: "ChatRoomBans",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ChatRoomId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DateBanned = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatRoomBans", x => new { x.UserId, x.ChatRoomId });
                    table.ForeignKey(
                        name: "FK_ChatRoomBans_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatRoomBans_ChatRooms_ChatRoomId",
                        column: x => x.ChatRoomId,
                        principalTable: "ChatRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomBans_ChatRoomId",
                table: "ChatRoomBans",
                column: "ChatRoomId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatRoomMemberRoles_AspNetUsers_UserId",
                table: "ChatRoomMemberRoles",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatRoomMemberRoles_AspNetUsers_UserId",
                table: "ChatRoomMemberRoles");

            migrationBuilder.DropTable(
                name: "ChatRoomBans");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatRoomMemberRoles_AspNetUsers_UserId",
                table: "ChatRoomMemberRoles",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
