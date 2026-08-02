import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { createCategorySchema, updateCategorySchema, type Category } from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser, type AuthUserParam } from "../../common/decorators/current-user.decorator";
import { CategoriesService } from "./categories.service";

@Controller("categories")
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(@Query("includeInactive") includeInactive?: string): Promise<Category[]> {
    return this.categoriesService.list(includeInactive === "true");
  }

  @Post()
  @RequirePermission("CATEGORIES_MANAGE")
  create(@Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<Category> {
    return this.categoriesService.create(createCategorySchema.parse(body), actor);
  }

  @Patch(":id")
  @RequirePermission("CATEGORIES_MANAGE")
  update(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<Category> {
    return this.categoriesService.update(id, updateCategorySchema.parse(body), actor);
  }
}
