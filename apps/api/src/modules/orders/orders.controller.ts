import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  addOrderItemSchema,
  cancelOrderItemSchema,
  cancelOrderSchema,
  createQuickSaleSchema,
  payOrderSchema,
  updateOrderItemQuantitySchema,
  type OrderDto,
} from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser, type AuthUserParam } from "../../common/decorators/current-user.decorator";
import { OrdersService } from "./orders.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post("quick-sales")
  @RequirePermission("QUICK_SALE")
  createQuickSale(@Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<OrderDto> {
    const input = createQuickSaleSchema.parse(body);
    return this.ordersService.createQuickSale(actor, input.idempotencyKey);
  }

  @Get("orders/:id")
  @RequirePermission("ORDERS_OPERATE")
  getById(@Param("id") id: string): Promise<OrderDto> {
    return this.ordersService.getById(id);
  }

  @Post("orders/:id/items")
  @RequirePermission("ORDERS_OPERATE")
  addItem(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<OrderDto> {
    return this.ordersService.addItem(id, addOrderItemSchema.parse(body), actor);
  }

  @Patch("orders/:id/items/:itemId")
  @RequirePermission("ORDERS_OPERATE")
  updateItemQuantity(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthUserParam,
  ): Promise<OrderDto> {
    const input = updateOrderItemQuantitySchema.parse(body);
    return this.ordersService.updateItemQuantity(id, itemId, input.quantity, actor);
  }

  @Post("orders/:id/items/:itemId/cancel")
  @RequirePermission("ORDERS_OPERATE")
  cancelItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthUserParam,
  ): Promise<OrderDto> {
    return this.ordersService.cancelItem(id, itemId, cancelOrderItemSchema.parse(body), actor);
  }

  @Post("orders/:id/pay")
  @RequirePermission("ORDERS_PAY")
  pay(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam) {
    return this.ordersService.pay(id, payOrderSchema.parse(body), actor);
  }

  @Post("orders/:id/cancel")
  @RequirePermission("ORDERS_CANCEL")
  cancelOrder(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<OrderDto> {
    const input = cancelOrderSchema.parse(body);
    return this.ordersService.cancelOrder(id, input.reason, actor);
  }
}
