using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class ChatRoomMemberDisplayRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DisplayRoleId",
                table: "ChatRoomMembers",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomMembers_DisplayRoleId",
                table: "ChatRoomMembers",
                column: "DisplayRoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatRoomMembers_ChatRoomRoles_DisplayRoleId",
                table: "ChatRoomMembers",
                column: "DisplayRoleId",
                principalTable: "ChatRoomRoles",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatRoomMembers_ChatRoomRoles_DisplayRoleId",
                table: "ChatRoomMembers");

            migrationBuilder.DropIndex(
                name: "IX_ChatRoomMembers_DisplayRoleId",
                table: "ChatRoomMembers");

            migrationBuilder.DropColumn(
                name: "DisplayRoleId",
                table: "ChatRoomMembers");
        }
    }
}
