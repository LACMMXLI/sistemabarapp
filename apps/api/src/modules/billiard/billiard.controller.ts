import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  cancelBilliardSessionSchema,
  createBilliardRateSchema,
  finishBilliardSessionSchema,
  startBilliardSessionSchema,
  updateBilliardRateSchema,
} from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser, type AuthUserParam } from "../../common/decorators/current-user.decorator";
import { BilliardService } from "./billiard.service";

@Controller("billiard")
@UseGuards(JwtAuthGuard)
export class BilliardController {
  constructor(private readonly billiardService: BilliardService) {}

  @Get("rates")
  listRates() {
    return this.billiardService.listRates();
  }

  @Get("sessions/active")
  findActiveSessionByTable(@Query("tableId") tableId: string) {
    return this.billiardService.findActiveSessionByTable(tableId);
  }

  @Post("rates")
  @RequirePermission("BILLIARD_RATES_MANAGE")
  createRate(@Body() body: unknown, @CurrentUser() actor: AuthUserParam) {
    return this.billiardService.createRate(createBilliardRateSchema.parse(body), actor);
  }

  @Post("rates/:id")
  @RequirePermission("BILLIARD_RATES_MANAGE")
  updateRate(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam) {
    return this.billiardService.updateRate(id, updateBilliardRateSchema.parse(body), actor);
  }

  @Post("sessions/tables/:tableId/start")
  @RequirePermission("BILLIARD_OPERATE")
  start(@Param("tableId") tableId: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam) {
    const input = startBilliardSessionSchema.parse(body);
    return this.billiardService.start(tableId, input.rateId, actor);
  }

  @Post("sessions/:id/pause")
  @RequirePermission("BILLIARD_OPERATE")
  pause(@Param("id") id: string, @CurrentUser() actor: AuthUserParam) {
    return this.billiardService.pause(id, actor);
  }

  @Post("sessions/:id/resume")
  @RequirePermission("BILLIARD_OPERATE")
  resume(@Param("id") id: string, @CurrentUser() actor: AuthUserParam) {
    return this.billiardService.resume(id, actor);
  }

  @Post("sessions/:id/finish")
  @RequirePermission("BILLIARD_OPERATE")
  finish(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam) {
    const input = finishBilliardSessionSchema.parse(body);
    return this.billiardService.finish(id, input.idempotencyKey, actor);
  }

  @Post("sessions/:id/cancel")
  @RequirePermission("BILLIARD_OPERATE")
  cancel(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam) {
    const input = cancelBilliardSessionSchema.parse(body);
    return this.billiardService.cancel(id, input.reason, actor);
  }
}
