import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { createUserSchema, updateUserSchema, type UserPublic } from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser, type AuthUserParam } from "../../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission("USERS_MANAGE")
  list(): Promise<UserPublic[]> {
    return this.usersService.list();
  }

  @Post()
  @RequirePermission("USERS_MANAGE")
  create(@Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<UserPublic> {
    return this.usersService.create(createUserSchema.parse(body), actor);
  }

  @Patch(":id")
  @RequirePermission("USERS_MANAGE")
  update(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<UserPublic> {
    return this.usersService.update(id, updateUserSchema.parse(body), actor);
  }
}
