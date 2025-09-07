using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ensure sequence exists
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT * FROM sys.sequences WHERE name = 'UserTagSequence' AND SCHEMA_NAME(schema_id) = 'dbo')
BEGIN
    CREATE SEQUENCE dbo.UserTagSequence AS INT START WITH 1 INCREMENT BY 1;
END");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_FriendCode",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "FriendCode",
                table: "AspNetUsers");

            // Add Tag column with default from sequence
            migrationBuilder.AddColumn<int>(
                name: "Tag",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValueSql: "NEXT VALUE FOR dbo.UserTagSequence");

            // Make sure existing rows have unique tags assigned (safety for some SQL Server behaviors)
            migrationBuilder.Sql(@"
UPDATE u
SET u.Tag = NEXT VALUE FOR dbo.UserTagSequence
FROM AspNetUsers u
WHERE u.Tag IS NULL;

DECLARE @maxTag INT = (SELECT ISNULL(MAX(Tag),0) FROM AspNetUsers);
-- Reseed the sequence to continue after current max
DECLARE @seqStartSql NVARCHAR(400) = N'ALTER SEQUENCE dbo.UserTagSequence RESTART WITH ' + CAST((@maxTag + 1) AS NVARCHAR(50));
EXEC(@seqStartSql);
");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_Tag",
                table: "AspNetUsers",
                column: "Tag",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_Tag",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Tag",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<string>(
                name: "FriendCode",
                table: "AspNetUsers",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_FriendCode",
                table: "AspNetUsers",
                column: "FriendCode",
                unique: true);

            // Optionally drop the sequence
            migrationBuilder.Sql(@"
IF EXISTS (SELECT * FROM sys.sequences WHERE name = 'UserTagSequence' AND SCHEMA_NAME(schema_id) = 'dbo')
BEGIN
    DROP SEQUENCE dbo.UserTagSequence;
END");
        }
    }
}
