import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { createPromotionSchema, updatePromotionSchema, type PromotionDto } from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser, type AuthUserParam } from "../../common/decorators/current-user.decorator";
import { PromotionsService } from "./promotions.service";

@Controller("promotions")
@UseGuards(JwtAuthGuard)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @RequirePermission("PROMOTIONS_MANAGE")
  list(): Promise<PromotionDto[]> {
    return this.promotionsService.list();
  }

  @Post()
  @RequirePermission("PROMOTIONS_MANAGE")
  create(@Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<PromotionDto> {
    return this.promotionsService.create(createPromotionSchema.parse(body), actor);
  }

  @Patch(":id")
  @RequirePermission("PROMOTIONS_MANAGE")
  update(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<PromotionDto> {
    return this.promotionsService.update(id, updatePromotionSchema.parse(body), actor);
  }
}
