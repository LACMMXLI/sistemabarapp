import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { createManualMovementSchema, type InventoryItemDto, type InventoryMovementDto } from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser, type AuthUserParam } from "../../common/decorators/current-user.decorator";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermission("INVENTORY_VIEW_FULL")
  list(): Promise<InventoryItemDto[]> {
    return this.inventoryService.list();
  }

  @Get("movements")
  @RequirePermission("INVENTORY_VIEW_FULL")
  movements(@Query("productId") productId?: string): Promise<InventoryMovementDto[]> {
    return this.inventoryService.movements(productId);
  }

  @Post("movements")
  @RequirePermission("INVENTORY_ADJUST")
  createMovement(@Body() body: unknown, @CurrentUser() actor: AuthUserParam) {
    return this.inventoryService.createManualMovement(createManualMovementSchema.parse(body), actor);
  }
}
