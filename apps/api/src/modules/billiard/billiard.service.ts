import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { BilliardRateDto, BilliardSessionDto, CreateBilliardRateInput, UpdateBilliardRateInput } from "@barapp/contracts";
import { ERROR_CODES } from "@barapp/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiException } from "../../common/errors/api-exception";
import { recordAudit } from "../../lib/audit";
import { recomputeOrderTotals } from "../orders/orders.helpers";
import { computeBilliardCharge, hourlyToPerMinute } from "../../lib/billing";
import type { AuthenticatedUser } from "../../common/types/auth-user";

@Injectable()
export class BilliardService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveSessionByTable(tableId: string): Promise<BilliardSessionDto | null> {
    const session = await this.prisma.billiardSession.findFirst({ where: { tableId, status: { in: ["ACTIVE", "PAUSED"] } } });
    if (!session) return null;
    return this.toSessionDto(session);
  }

  async listRates(): Promise<BilliardRateDto[]> {
    const rates = await this.prisma.billiardRate.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    return rates.map(toRateDto);
  }

  async createRate(input: CreateBilliardRateInput, actor: AuthenticatedUser): Promise<BilliardRateDto> {
    const rate = await this.prisma.billiardRate.create({
      data: {
        name: input.name,
        pricePerHourCents: input.pricePerHourCents,
        pricePerMinuteCents: hourlyToPerMinute(input.pricePerHourCents),
        minimumChargeCents: input.minimumChargeCents,
      },
    });
    await recordAudit(this.prisma, { action: "BILLIARD_RATE_CREATE", entityType: "BilliardRate", entityId: rate.id, userId: actor.userId });
    return toRateDto(rate);
  }

  async updateRate(id: string, input: UpdateBilliardRateInput, actor: AuthenticatedUser): Promise<BilliardRateDto> {
    const existing = await this.prisma.billiardRate.findUnique({ where: { id } });
    if (!existing) throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Tarifa no encontrada.");
    const rate = await this.prisma.billiardRate.update({
      where: { id },
      data: {
        name: input.name,
        pricePerHourCents: input.pricePerHourCents,
        pricePerMinuteCents: input.pricePerHourCents !== undefined ? hourlyToPerMinute(input.pricePerHourCents) : undefined,
        minimumChargeCents: input.minimumChargeCents,
        active: input.active,
      },
    });
    await recordAudit(this.prisma, { action: "BILLIARD_RATE_UPDATE", entityType: "BilliardRate", entityId: id, userId: actor.userId });
    return toRateDto(rate);
  }

  async start(tableId: string, rateId: string, actor: AuthenticatedUser): Promise<BilliardSessionDto> {
    const table = await this.prisma.diningTable.findUnique({ where: { id: tableId } });
    if (!table || table.type !== "BILLIARD") {
      throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Mesa de billar no encontrada.");
    }
    const rate = await this.prisma.billiardRate.findUnique({ where: { id: rateId } });
    if (!rate || !rate.active) {
      throw new ApiException(400, ERROR_CODES.VALIDATION_ERROR, "Tarifa no encontrada o inactiva.");
    }
    const order = await this.prisma.order.findFirst({ where: { tableId, status: "OPEN" } });
    if (!order) {
      throw new ApiException(409, ERROR_CODES.ORDER_NOT_OPEN, "La mesa debe tener una orden abierta antes de iniciar billar.");
    }

    try {
      const session = await this.prisma.$transaction(async (tx) => {
        const created = await tx.billiardSession.create({
          data: {
            tableId,
            orderId: order.id,
            rateId,
            appliedPricePerMinuteCents: rate.pricePerMinuteCents,
            minimumChargeCents: rate.minimumChargeCents,
            currentSegmentStartedAt: new Date(),
            startedById: actor.userId,
          },
        });
        await recordAudit(tx, { action: "BILLIARD_START", entityType: "BilliardSession", entityId: created.id, userId: actor.userId });
        return created;
      });
      return this.toSessionDto(session);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ApiException(409, ERROR_CODES.BILLIARD_ALREADY_ACTIVE, "Ya existe una sesión de billar activa en esta mesa.");
      }
      throw err;
    }
  }

  async pause(sessionId: string, actor: AuthenticatedUser): Promise<BilliardSessionDto> {
    const session = await this.requireStatus(sessionId, "ACTIVE");
    const runningSeconds = Math.floor((Date.now() - session.currentSegmentStartedAt!.getTime()) / 1000);
    const updated = await this.prisma.billiardSession.update({
      where: { id: sessionId },
      data: {
        status: "PAUSED",
        accumulatedSeconds: session.accumulatedSeconds + runningSeconds,
        currentSegmentStartedAt: null,
        pausedById: actor.userId,
      },
    });
    await recordAudit(this.prisma, { action: "BILLIARD_PAUSE", entityType: "BilliardSession", entityId: sessionId, userId: actor.userId });
    return this.toSessionDto(updated);
  }

  async resume(sessionId: string, actor: AuthenticatedUser): Promise<BilliardSessionDto> {
    await this.requireStatus(sessionId, "PAUSED");
    const updated = await this.prisma.billiardSession.update({
      where: { id: sessionId },
      data: { status: "ACTIVE", currentSegmentStartedAt: new Date(), resumedById: actor.userId },
    });
    await recordAudit(this.prisma, { action: "BILLIARD_RESUME", entityType: "BilliardSession", entityId: sessionId, userId: actor.userId });
    return this.toSessionDto(updated);
  }

  async finish(sessionId: string, idempotencyKey: string, actor: AuthenticatedUser): Promise<BilliardSessionDto> {
    const existing = await this.prisma.billiardSession.findUnique({ where: { id: sessionId } });
    if (!existing) throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Sesión no encontrada.");
    if (existing.status === "FINISHED") {
      if (existing.chargeIdempotencyKey === idempotencyKey) return this.toSessionDto(existing);
      return this.toSessionDto(existing);
    }
    if (existing.status !== "ACTIVE" && existing.status !== "PAUSED") {
      throw new ApiException(409, ERROR_CODES.BILLIARD_NOT_ACTIVE, "La sesión no está activa ni pausada.");
    }

    const runningSeconds = existing.status === "ACTIVE" && existing.currentSegmentStartedAt
      ? Math.floor((Date.now() - existing.currentSegmentStartedAt.getTime()) / 1000)
      : 0;
    const totalSeconds = existing.accumulatedSeconds + runningSeconds;
    const billedCents = computeBilliardCharge(totalSeconds, existing.appliedPricePerMinuteCents, existing.minimumChargeCents);

    const updated = await this.prisma.$transaction(async (tx) => {
      const finished = await tx.billiardSession.update({
        where: { id: sessionId },
        data: {
          status: "FINISHED",
          accumulatedSeconds: totalSeconds,
          currentSegmentStartedAt: null,
          finishedAt: new Date(),
          finishedById: actor.userId,
          billedCents,
          chargeIdempotencyKey: idempotencyKey,
        },
      });

      await tx.order.update({
        where: { id: finished.orderId },
        data: { billiardChargeCents: { increment: billedCents } },
      });
      await recomputeOrderTotals(tx, finished.orderId);
      await recordAudit(tx, { action: "BILLIARD_FINISH", entityType: "BilliardSession", entityId: sessionId, userId: actor.userId, metadata: { billedCents, totalSeconds } });
      return finished;
    });

    return this.toSessionDto(updated);
  }

  async cancel(sessionId: string, reason: string, actor: AuthenticatedUser): Promise<BilliardSessionDto> {
    await this.requireStatus(sessionId, "ACTIVE", "PAUSED");
    const updated = await this.prisma.billiardSession.update({
      where: { id: sessionId },
      data: { status: "CANCELLED", finishedAt: new Date(), finishedById: actor.userId, cancelReason: reason },
    });
    await recordAudit(this.prisma, { action: "BILLIARD_CANCEL", entityType: "BilliardSession", entityId: sessionId, userId: actor.userId, metadata: { reason } });
    return this.toSessionDto(updated);
  }

  private async requireStatus(sessionId: string, ...statuses: Array<"ACTIVE" | "PAUSED">) {
    const session = await this.prisma.billiardSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Sesión no encontrada.");
    if (!statuses.includes(session.status as "ACTIVE" | "PAUSED")) {
      throw new ApiException(409, ERROR_CODES.BILLIARD_NOT_ACTIVE, "La sesión no está en el estado esperado.");
    }
    return session;
  }

  private async toSessionDto(session: {
    id: string;
    tableId: string;
    orderId: string;
    status: string;
    rateId: string;
    appliedPricePerMinuteCents: number;
    minimumChargeCents: number;
    startedAt: Date;
    accumulatedSeconds: number;
    currentSegmentStartedAt: Date | null;
    finishedAt: Date | null;
    billedCents: number | null;
    cancelReason: string | null;
    startedById: string;
    finishedById: string | null;
  }): Promise<BilliardSessionDto> {
    const [startedBy, finishedBy] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: session.startedById } }),
      session.finishedById ? this.prisma.user.findUnique({ where: { id: session.finishedById } }) : Promise.resolve(null),
    ]);
    return {
      id: session.id,
      tableId: session.tableId,
      orderId: session.orderId,
      status: session.status as BilliardSessionDto["status"],
      rateId: session.rateId,
      appliedPricePerMinuteCents: session.appliedPricePerMinuteCents,
      minimumChargeCents: session.minimumChargeCents,
      startedAt: session.startedAt.toISOString(),
      accumulatedSeconds: session.accumulatedSeconds,
      currentSegmentStartedAt: session.currentSegmentStartedAt?.toISOString() ?? null,
      finishedAt: session.finishedAt?.toISOString() ?? null,
      billedCents: session.billedCents,
      startedByName: startedBy.fullName,
      finishedByName: finishedBy?.fullName ?? null,
      cancelReason: session.cancelReason,
    };
  }
}

function toRateDto(rate: {
  id: string;
  name: string;
  pricePerHourCents: number;
  pricePerMinuteCents: number;
  minimumChargeCents: number;
  active: boolean;
}): BilliardRateDto {
  return {
    id: rate.id,
    name: rate.name,
    pricePerHourCents: rate.pricePerHourCents,
    pricePerMinuteCents: rate.pricePerMinuteCents,
    minimumChargeCents: rate.minimumChargeCents,
    active: rate.active,
  };
}
