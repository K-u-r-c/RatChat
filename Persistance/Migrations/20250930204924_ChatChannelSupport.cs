using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class ChatChannelSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatChannels_ChatRoomId_Name",
                table: "ChatChannels");

            migrationBuilder.AddColumn<string>(
                name: "ChannelId",
                table: "Messages",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ChannelId_CreatedAt",
                table: "Messages",
                columns: new[] { "ChannelId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatChannels_ChatRoomId_Type_Name",
                table: "ChatChannels",
                columns: new[] { "ChatRoomId", "Type", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatChannels_ChatRoomId_Type_Position",
                table: "ChatChannels",
                columns: new[] { "ChatRoomId", "Type", "Position" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_ChatChannels_ChannelId",
                table: "Messages",
                column: "ChannelId",
                principalTable: "ChatChannels",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Messages_ChatChannels_ChannelId",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_ChannelId_CreatedAt",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_ChatChannels_ChatRoomId_Type_Name",
                table: "ChatChannels");

            migrationBuilder.DropIndex(
                name: "IX_ChatChannels_ChatRoomId_Type_Position",
                table: "ChatChannels");

            migrationBuilder.DropColumn(
                name: "ChannelId",
                table: "Messages");

            migrationBuilder.CreateIndex(
                name: "IX_ChatChannels_ChatRoomId_Name",
                table: "ChatChannels",
                columns: new[] { "ChatRoomId", "Name" },
                unique: true);
        }
    }
}
