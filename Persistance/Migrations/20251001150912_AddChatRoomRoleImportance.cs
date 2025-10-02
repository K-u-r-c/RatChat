using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddChatRoomRoleImportance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Importance",
                table: "ChatRoomRoles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                @"WITH RankedRoles AS (
                    SELECT
                        Id,
                        ROW_NUMBER() OVER (
                            PARTITION BY ChatRoomId
                            ORDER BY CASE WHEN IsDefault = 1 THEN 0 ELSE 1 END,
                                     CreatedAt,
                                     Id
                        ) - 1 AS RowNumber
                    FROM ChatRoomRoles
                )
                UPDATE ChatRoomRoles
                SET Importance = RankedRoles.RowNumber
                FROM RankedRoles
                WHERE ChatRoomRoles.Id = RankedRoles.Id;");

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomRoles_ChatRoomId_Importance",
                table: "ChatRoomRoles",
                columns: new[] { "ChatRoomId", "Importance" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatRoomRoles_ChatRoomId_Importance",
                table: "ChatRoomRoles");

            migrationBuilder.DropColumn(
                name: "Importance",
                table: "ChatRoomRoles");
        }
    }
}
