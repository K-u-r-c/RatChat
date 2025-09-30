using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class MultiChannelSupport : Migration
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
                nullable: true);

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

            migrationBuilder.Sql(@"
                INSERT INTO ChatChannels (Id, ChatRoomId, Name, Type, Position, CreatedAt)
                SELECT NEWID(), cr.Id, 'general', 0, 0, SYSUTCDATETIME()
                FROM ChatRooms cr
                WHERE NOT EXISTS (
                    SELECT 1 FROM ChatChannels cc
                    WHERE cc.ChatRoomId = cr.Id AND cc.Type = 0
                );
            ");

            migrationBuilder.Sql(@"
                WITH OrderedChannels AS (
                    SELECT cc.Id,
                           ROW_NUMBER() OVER (PARTITION BY cc.ChatRoomId, cc.Type ORDER BY cc.Position, cc.CreatedAt) - 1 AS NewPosition
                    FROM ChatChannels cc
                )
                UPDATE cc
                SET Position = oc.NewPosition
                FROM ChatChannels cc
                INNER JOIN OrderedChannels oc ON oc.Id = cc.Id;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ChannelId_CreatedAt",
                table: "Messages",
                columns: new[] { "ChannelId", "CreatedAt" });

            migrationBuilder.Sql(@"
                UPDATE Messages
                SET ChannelId = cc.Id
                FROM Messages m
                INNER JOIN ChatChannels cc ON cc.ChatRoomId = m.ChatRoomId AND cc.Type = 0
                WHERE Messages.Id = m.Id AND Messages.ChannelId IS NULL;
            ");

            migrationBuilder.AlterColumn<string>(
                name: "ChannelId",
                table: "Messages",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_ChatChannels_ChannelId",
                table: "Messages",
                column: "ChannelId",
                principalTable: "ChatChannels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
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
