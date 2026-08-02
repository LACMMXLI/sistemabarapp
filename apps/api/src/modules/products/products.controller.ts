import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { createProductSchema, updateProductSchema, type ProductAdmin, type ProductOperational } from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser, type AuthUserParam } from "../../common/decorators/current-user.decorator";
import { ProductsService } from "./products.service";

@Controller("products")
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query("categoryId") categoryId?: string): Promise<ProductOperational[]> {
    return this.productsService.listOperational(categoryId);
  }

  @Get("admin")
  @RequirePermission("PRODUCTS_MANAGE")
  listAdmin(@Query("categoryId") categoryId?: string): Promise<ProductAdmin[]> {
    return this.productsService.listAdmin(categoryId);
  }

  @Post()
  @RequirePermission("PRODUCTS_MANAGE")
  create(@Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<ProductAdmin> {
    return this.productsService.create(createProductSchema.parse(body), actor);
  }

  @Patch(":id")
  @RequirePermission("PRODUCTS_MANAGE")
  update(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<ProductAdmin> {
    return this.productsService.update(id, updateProductSchema.parse(body), actor);
  }
}
