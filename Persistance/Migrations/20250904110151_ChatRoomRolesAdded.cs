using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistance.Migrations
{
    /// <inheritdoc />
    public partial class ChatRoomRolesAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsAdmin",
                table: "ChatRoomMembers",
                newName: "IsOwner");

            migrationBuilder.AddColumn<string>(
                name: "OwnerId",
                table: "ChatRooms",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ChatRoomPermissions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatRoomPermissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChatRoomRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Color = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    ChatRoomId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatRoomRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatRoomRoles_ChatRooms_ChatRoomId",
                        column: x => x.ChatRoomId,
                        principalTable: "ChatRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatRoomMemberRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ChatRoomId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AssignedById = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatRoomMemberRoles", x => new { x.UserId, x.ChatRoomId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_ChatRoomMemberRoles_AspNetUsers_AssignedById",
                        column: x => x.AssignedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ChatRoomMemberRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ChatRoomMemberRoles_ChatRoomRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "ChatRoomRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatRoomMemberRoles_ChatRooms_ChatRoomId",
                        column: x => x.ChatRoomId,
                        principalTable: "ChatRooms",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatRoomRolePermissions",
                columns: table => new
                {
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PermissionId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    IsAllowed = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatRoomRolePermissions", x => new { x.RoleId, x.PermissionId });
                    table.ForeignKey(
                        name: "FK_ChatRoomRolePermissions_ChatRoomPermissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "ChatRoomPermissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatRoomRolePermissions_ChatRoomRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "ChatRoomRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatRooms_OwnerId",
                table: "ChatRooms",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomMemberRoles_AssignedById",
                table: "ChatRoomMemberRoles",
                column: "AssignedById");

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomMemberRoles_ChatRoomId",
                table: "ChatRoomMemberRoles",
                column: "ChatRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomMemberRoles_RoleId",
                table: "ChatRoomMemberRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomPermissions_Name",
                table: "ChatRoomPermissions",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomRolePermissions_PermissionId",
                table: "ChatRoomRolePermissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoomRoles_ChatRoomId_Name",
                table: "ChatRoomRoles",
                columns: new[] { "ChatRoomId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatRooms_AspNetUsers_OwnerId",
                table: "ChatRooms",
                column: "OwnerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatRooms_AspNetUsers_OwnerId",
                table: "ChatRooms");

            migrationBuilder.DropTable(
                name: "ChatRoomMemberRoles");

            migrationBuilder.DropTable(
                name: "ChatRoomRolePermissions");

            migrationBuilder.DropTable(
                name: "ChatRoomPermissions");

            migrationBuilder.DropTable(
                name: "ChatRoomRoles");

            migrationBuilder.DropIndex(
                name: "IX_ChatRooms_OwnerId",
                table: "ChatRooms");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "ChatRooms");

            migrationBuilder.RenameColumn(
                name: "IsOwner",
                table: "ChatRoomMembers",
                newName: "IsAdmin");
        }
    }
}
