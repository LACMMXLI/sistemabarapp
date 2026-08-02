import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  closeCashShiftSchema,
  createCashMovementSchema,
  createCashRegisterSchema,
  openCashShiftSchema,
  type CashRegisterDto,
} from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser, type AuthUserParam } from "../../common/decorators/current-user.decorator";
import { CashService } from "./cash.service";

@Controller("cash")
@UseGuards(JwtAuthGuard)
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get("registers")
  @RequirePermission("CASH_VIEW_SHIFTS")
  listRegisters(): Promise<CashRegisterDto[]> {
    return this.cashService.listRegisters();
  }

  @Post("registers")
  @RequirePermission("CASH_OPEN")
  createRegister(@Body() body: unknown, @CurrentUser() actor: AuthUserParam) {
    const input = createCashRegisterSchema.parse(body);
    return this.cashService.createRegister(input.name, actor);
  }

  @Post("shifts")
  @RequirePermission("CASH_OPEN")
  openShift(@Body() body: unknown, @CurrentUser() actor: AuthUserParam) {
    return this.cashService.openShift(openCashShiftSchema.parse(body), actor);
  }

  @Get("shifts/:id")
  @RequirePermission("CASH_VIEW_SHIFTS")
  getShift(@Param("id") id: string) {
    return this.cashService.getShiftSummary(id);
  }

  @Post("shifts/:id/movements")
  @RequirePermission("CASH_MOVEMENT")
  createMovement(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam) {
    return this.cashService.createMovement(id, createCashMovementSchema.parse(body), actor);
  }

  @Post("shifts/:id/close")
  @RequirePermission("CASH_CLOSE")
  closeShift(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam) {
    return this.cashService.closeShift(id, closeCashShiftSchema.parse(body), actor);
  }
}
