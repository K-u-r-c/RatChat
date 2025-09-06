using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCascadeOnMemberRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatRoomMemberRoles_AspNetUsers_UserId",
                table: "ChatRoomMemberRoles");

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

            migrationBuilder.AddForeignKey(
                name: "FK_ChatRoomMemberRoles_AspNetUsers_UserId",
                table: "ChatRoomMemberRoles",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
