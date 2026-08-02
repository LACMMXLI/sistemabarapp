import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { reportsRangeQuerySchema } from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(JwtAuthGuard)
@RequirePermission("REPORTS_VIEW")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("sales")
  sales(@Query() query: unknown) {
    return this.reportsService.sales(reportsRangeQuerySchema.parse(query));
  }

  @Get("products")
  products(@Query() query: unknown) {
    return this.reportsService.products(reportsRangeQuerySchema.parse(query));
  }

  @Get("billiard")
  billiard(@Query() query: unknown) {
    return this.reportsService.billiard(reportsRangeQuerySchema.parse(query));
  }
}
