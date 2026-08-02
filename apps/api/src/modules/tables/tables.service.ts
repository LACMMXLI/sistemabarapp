import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { CreateTableInput, DiningTable, UpdateTableInput } from "@barapp/contracts";
import { ERROR_CODES } from "@barapp/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiException } from "../../common/errors/api-exception";
import { recordAudit } from "../../lib/audit";
import type { AuthenticatedUser } from "../../common/types/auth-user";

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<DiningTable[]> {
    const tables = await this.prisma.diningTable.findMany({
      include: {
        orders: {
          where: { status: "OPEN" },
          include: { openedBy: true, items: true },
          take: 1,
        },
        billiardSessions: {
          where: { status: { in: ["ACTIVE", "PAUSED"] } },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    return tables.map((t) => {
      const order = t.orders[0] ?? null;
      const billiard = t.billiardSessions[0] ?? null;
      const orderTotalCents = order ? order.totalCents : null;

      let status: DiningTable["status"] = "AVAILABLE";
      if (t.outOfService) status = "OUT_OF_SERVICE";
      else if (billiard) status = "BILLIARD_ACTIVE";
      else if (order) status = "OCCUPIED";

      let billiardElapsedSeconds: number | null = null;
      if (billiard) {
        const runningSeconds = billiard.status === "ACTIVE" && billiard.currentSegmentStartedAt
          ? Math.floor((Date.now() - billiard.currentSegmentStartedAt.getTime()) / 1000)
          : 0;
        billiardElapsedSeconds = billiard.accumulatedSeconds + runningSeconds;
      }

      return {
        id: t.id,
        name: t.name,
        type: t.type,
        status,
        capacity: t.capacity,
        outOfService: t.outOfService,
        billiardRateId: t.billiardRateId,
        activeOrderId: order?.id ?? null,
        orderTotalCents,
        openedByName: order?.openedBy.fullName ?? null,
        openedAt: order?.openedAt.toISOString() ?? null,
        billiardElapsedSeconds,
        billiardStatus: billiard ? (billiard.status as "ACTIVE" | "PAUSED") : null,
      };
    });
  }

  async create(input: CreateTableInput, actor: AuthenticatedUser): Promise<void> {
    const existing = await this.prisma.diningTable.findUnique({ where: { name: input.name } });
    if (existing) {
      throw new ApiException(409, ERROR_CODES.CONFLICT, "Ya existe una mesa con ese nombre.");
    }
    const table = await this.prisma.diningTable.create({
      data: { name: input.name, type: input.type, capacity: input.capacity ?? null, billiardRateId: input.billiardRateId ?? null },
    });
    await recordAudit(this.prisma, { action: "TABLE_CREATE", entityType: "DiningTable", entityId: table.id, userId: actor.userId });
  }

  async update(id: string, input: UpdateTableInput, actor: AuthenticatedUser): Promise<void> {
    const existing = await this.prisma.diningTable.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Mesa no encontrada.");
    }
    await this.prisma.diningTable.update({
      where: { id },
      data: { name: input.name, capacity: input.capacity, billiardRateId: input.billiardRateId, outOfService: input.outOfService },
    });
    await recordAudit(this.prisma, {
      action: "TABLE_UPDATE",
      entityType: "DiningTable",
      entityId: id,
      userId: actor.userId,
      metadata: { changedFields: Object.keys(input) },
    });
  }

  /**
   * Abre una mesa de forma atómica: si ya tiene una orden OPEN la reutiliza;
   * si no, crea una nueva. La restricción parcial única en Order (tableId,
   * status=OPEN) garantiza que dos toques simultáneos nunca creen dos órdenes:
   * si ambos intentan crear, uno gana y el otro recibe P2002, y entonces
   * recupera la orden ganadora.
   */
  async openOrGetOrder(tableId: string, actor: AuthenticatedUser): Promise<string> {
    const table = await this.prisma.diningTable.findUnique({ where: { id: tableId } });
    if (!table) {
      throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Mesa no encontrada.");
    }
    if (table.outOfService) {
      throw new ApiException(409, ERROR_CODES.CONFLICT, "La mesa está fuera de servicio.");
    }

    const existingOrder = await this.prisma.order.findFirst({ where: { tableId, status: "OPEN" } });
    if (existingOrder) return existingOrder.id;

    try {
      const created = await this.prisma.order.create({
        data: { kind: "TABLE", tableId, openedById: actor.userId },
      });
      await recordAudit(this.prisma, { action: "ORDER_OPEN_TABLE", entityType: "Order", entityId: created.id, userId: actor.userId });
      return created.id;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const raceWinner = await this.prisma.order.findFirst({ where: { tableId, status: "OPEN" } });
        if (raceWinner) return raceWinner.id;
      }
      throw err;
    }
  }
}
