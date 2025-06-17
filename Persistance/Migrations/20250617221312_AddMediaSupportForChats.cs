using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaSupportForChats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "MediaFileSize",
                table: "Messages",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaOriginalFileName",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaPublicId",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaType",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaUrl",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Messages",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "MediaFileSize",
                table: "DirectMessages",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaOriginalFileName",
                table: "DirectMessages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaPublicId",
                table: "DirectMessages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaType",
                table: "DirectMessages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaUrl",
                table: "DirectMessages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "DirectMessages",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MediaFileSize",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "MediaOriginalFileName",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "MediaPublicId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "MediaType",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "MediaUrl",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "MediaFileSize",
                table: "DirectMessages");

            migrationBuilder.DropColumn(
                name: "MediaOriginalFileName",
                table: "DirectMessages");

            migrationBuilder.DropColumn(
                name: "MediaPublicId",
                table: "DirectMessages");

            migrationBuilder.DropColumn(
                name: "MediaType",
                table: "DirectMessages");

            migrationBuilder.DropColumn(
                name: "MediaUrl",
                table: "DirectMessages");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "DirectMessages");
        }
    }
}
