import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { createTableSchema, updateTableSchema, type DiningTable } from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser, type AuthUserParam } from "../../common/decorators/current-user.decorator";
import { TablesService } from "./tables.service";

@Controller("tables")
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  list(): Promise<DiningTable[]> {
    return this.tablesService.list();
  }

  @Post()
  @RequirePermission("TABLES_MANAGE")
  create(@Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<void> {
    return this.tablesService.create(createTableSchema.parse(body), actor);
  }

  @Patch(":id")
  @RequirePermission("TABLES_MANAGE")
  update(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<void> {
    return this.tablesService.update(id, updateTableSchema.parse(body), actor);
  }

  @Post(":id/open")
  @RequirePermission("ORDERS_OPERATE")
  async open(@Param("id") id: string, @CurrentUser() actor: AuthUserParam): Promise<{ orderId: string }> {
    const orderId = await this.tablesService.openOrGetOrder(id, actor);
    return { orderId };
  }
}
