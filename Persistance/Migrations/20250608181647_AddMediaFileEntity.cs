using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaFileEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MediaFiles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PublicId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MediaType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    OriginalFileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ChatRoomId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    ChannelId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UploadedById = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FileHash = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReferenceCount = table.Column<int>(type: "int", nullable: false, defaultValue: 1)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MediaFiles_AspNetUsers_UploadedById",
                        column: x => x.UploadedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MediaFiles_ChatRooms_ChatRoomId",
                        column: x => x.ChatRoomId,
                        principalTable: "ChatRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MediaFiles_Category_ChatRoomId",
                table: "MediaFiles",
                columns: new[] { "Category", "ChatRoomId" });

            migrationBuilder.CreateIndex(
                name: "IX_MediaFiles_ChatRoomId",
                table: "MediaFiles",
                column: "ChatRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_MediaFiles_FileHash",
                table: "MediaFiles",
                column: "FileHash");

            migrationBuilder.CreateIndex(
                name: "IX_MediaFiles_PublicId",
                table: "MediaFiles",
                column: "PublicId");

            migrationBuilder.CreateIndex(
                name: "IX_MediaFiles_UploadedById",
                table: "MediaFiles",
                column: "UploadedById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MediaFiles");
        }
    }
}
