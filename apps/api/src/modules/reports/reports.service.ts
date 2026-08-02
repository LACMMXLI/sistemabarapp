import { Injectable } from "@nestjs/common";
import { toZonedTime } from "date-fns-tz";
import type { BilliardReportDto, ProductsReportDto, ReportsRangeQuery, SalesReportDto } from "@barapp/contracts";
import { APP_TIMEZONE } from "@barapp/config";
import { PrismaService } from "../../prisma/prisma.service";
import { resolveDateRange } from "./reports.helpers";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async sales(query: ReportsRangeQuery): Promise<SalesReportDto> {
    const { from, to } = resolveDateRange(query);
    const orders = await this.prisma.order.findMany({
      where: { status: "PAID", paidAt: { gte: from, lte: to } },
      include: { payments: { include: { details: true } }, openedBy: true },
    });

    const totalSalesCents = orders.reduce((s, o) => s + o.totalCents, 0);
    const orderCount = orders.length;
    const averageTicketCents = orderCount > 0 ? Math.round(totalSalesCents / orderCount) : 0;

    const byMethod = new Map<string, number>();
    const byHour = new Map<number, number>();
    const byEmployee = new Map<string, number>();

    for (const order of orders) {
      for (const payment of order.payments) {
        for (const detail of payment.details) {
          byMethod.set(detail.method, (byMethod.get(detail.method) ?? 0) + detail.amountCents);
        }
      }
      const hour = order.paidAt ? toZonedTime(order.paidAt, APP_TIMEZONE).getHours() : 0;
      byHour.set(hour, (byHour.get(hour) ?? 0) + order.totalCents);
      byEmployee.set(order.openedBy.fullName, (byEmployee.get(order.openedBy.fullName) ?? 0) + order.totalCents);
    }

    return {
      totalSalesCents,
      orderCount,
      averageTicketCents,
      byPaymentMethod: Array.from(byMethod.entries()).map(([method, totalCents]) => ({ method, totalCents })),
      byHour: Array.from(byHour.entries()).map(([hour, totalCents]) => ({ hour, totalCents })).sort((a, b) => a.hour - b.hour),
      byEmployee: Array.from(byEmployee.entries()).map(([userName, totalCents]) => ({ userName, totalCents })),
    };
  }

  async products(query: ReportsRangeQuery): Promise<ProductsReportDto> {
    const { from, to } = resolveDateRange(query);
    const items = await this.prisma.orderItem.findMany({
      where: { cancelledAt: null, order: { status: "PAID", paidAt: { gte: from, lte: to } } },
      include: { product: { include: { category: true } } },
    });

    const byProduct = new Map<string, { productName: string; quantitySold: number; revenueCents: number }>();
    const byCategory = new Map<string, { categoryName: string; revenueCents: number }>();

    for (const item of items) {
      const p = byProduct.get(item.productId) ?? { productName: item.productNameSnapshot, quantitySold: 0, revenueCents: 0 };
      p.quantitySold += item.quantity;
      p.revenueCents += item.totalCents;
      byProduct.set(item.productId, p);

      const c = byCategory.get(item.product.categoryId) ?? { categoryName: item.product.category.name, revenueCents: 0 };
      c.revenueCents += item.totalCents;
      byCategory.set(item.product.categoryId, c);
    }

    return {
      topProducts: Array.from(byProduct.entries())
        .map(([productId, v]) => ({ productId, ...v }))
        .sort((a, b) => b.revenueCents - a.revenueCents)
        .slice(0, 20),
      byCategory: Array.from(byCategory.entries()).map(([categoryId, v]) => ({ categoryId, ...v })),
    };
  }

  async billiard(query: ReportsRangeQuery): Promise<BilliardReportDto> {
    const { from, to } = resolveDateRange(query);
    const sessions = await this.prisma.billiardSession.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { table: true },
    });

    const finished = sessions.filter((s) => s.status === "FINISHED");
    const cancelledCount = sessions.filter((s) => s.status === "CANCELLED").length;
    const totalSeconds = finished.reduce((s, session) => s + session.accumulatedSeconds, 0);
    const revenueCents = finished.reduce((s, session) => s + (session.billedCents ?? 0), 0);

    const byTable = new Map<string, { tableName: string; revenueCents: number; sessionCount: number }>();
    for (const session of finished) {
      const t = byTable.get(session.tableId) ?? { tableName: session.table.name, revenueCents: 0, sessionCount: 0 };
      t.revenueCents += session.billedCents ?? 0;
      t.sessionCount += 1;
      byTable.set(session.tableId, t);
    }

    return {
      sessionCount: finished.length,
      cancelledCount,
      totalSeconds,
      revenueCents,
      byTable: Array.from(byTable.entries()).map(([tableId, v]) => ({ tableId, ...v })),
    };
  }
}
