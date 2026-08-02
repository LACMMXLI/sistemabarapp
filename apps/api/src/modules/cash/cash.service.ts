import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  CashRegisterDto,
  CashShiftSummaryDto,
  CloseCashShiftInput,
  CreateCashMovementInput,
  OpenCashShiftInput,
} from "@barapp/contracts";
import { ERROR_CODES } from "@barapp/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiException } from "../../common/errors/api-exception";
import { recordAudit } from "../../lib/audit";
import { computeExpectedCash } from "../../lib/billing";
import type { AuthenticatedUser } from "../../common/types/auth-user";

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  async listRegisters(): Promise<CashRegisterDto[]> {
    const registers = await this.prisma.cashRegister.findMany({
      include: { shifts: { where: { status: "OPEN" }, take: 1 } },
      orderBy: { name: "asc" },
    });
    return registers.map((r) => ({
      id: r.id,
      name: r.name,
      active: r.active,
      openShiftId: r.shifts[0]?.id ?? null,
    }));
  }

  async createRegister(name: string, actor: AuthenticatedUser): Promise<CashRegisterDto> {
    const register = await this.prisma.cashRegister.create({ data: { name } });
    await recordAudit(this.prisma, { action: "CASH_REGISTER_CREATE", entityType: "CashRegister", entityId: register.id, userId: actor.userId });
    return { id: register.id, name: register.name, active: register.active, openShiftId: null };
  }

  async openShift(input: OpenCashShiftInput, actor: AuthenticatedUser): Promise<CashShiftSummaryDto> {
    try {
      const shift = await this.prisma.$transaction(async (tx) => {
        const created = await tx.cashShift.create({
          data: {
            registerId: input.registerId,
            openingFloatCents: input.openingFloatCents,
            openedById: actor.userId,
          },
        });
        await recordAudit(tx, { action: "CASH_SHIFT_OPEN", entityType: "CashShift", entityId: created.id, userId: actor.userId });
        return created;
      });
      return this.getShiftSummary(shift.id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ApiException(409, ERROR_CODES.CASH_SHIFT_ALREADY_OPEN, "Ya existe un turno abierto para esta caja.");
      }
      throw err;
    }
  }

  async createMovement(shiftId: string, input: CreateCashMovementInput, actor: AuthenticatedUser) {
    const shift = await this.prisma.cashShift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.status !== "OPEN") {
      throw new ApiException(409, ERROR_CODES.CASH_SHIFT_NOT_OPEN, "El turno no está abierto.");
    }
    const movement = await this.prisma.cashMovement.create({
      data: { shiftId, type: input.type, amountCents: input.amountCents, reason: input.reason, userId: actor.userId },
    });
    await recordAudit(this.prisma, { action: "CASH_MOVEMENT_CREATE", entityType: "CashMovement", entityId: movement.id, userId: actor.userId, metadata: { type: input.type, amountCents: input.amountCents } });
    return {
      id: movement.id,
      type: movement.type,
      amountCents: movement.amountCents,
      reason: movement.reason,
      userName: actor.username,
      createdAt: movement.createdAt.toISOString(),
    };
  }

  async closeShift(shiftId: string, input: CloseCashShiftInput, actor: AuthenticatedUser): Promise<CashShiftSummaryDto> {
    const shift = await this.prisma.cashShift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Turno no encontrado.");
    if (shift.status === "CLOSED") {
      if (shift.closeIdempotencyKey === input.idempotencyKey) {
        return this.getShiftSummary(shiftId);
      }
      throw new ApiException(409, ERROR_CODES.PAYMENT_ALREADY_PROCESSED, "El turno ya fue cerrado.");
    }

    const summary = await this.getShiftSummary(shiftId);
    const differenceCents = input.countedCashCents - summary.expectedCashCents;

    await this.prisma.cashShift.update({
      where: { id: shiftId },
      data: {
        status: "CLOSED",
        closedById: actor.userId,
        closedAt: new Date(),
        countedCashCents: input.countedCashCents,
        differenceCents,
        closeIdempotencyKey: input.idempotencyKey,
      },
    });
    await recordAudit(this.prisma, { action: "CASH_SHIFT_CLOSE", entityType: "CashShift", entityId: shiftId, userId: actor.userId, metadata: { countedCashCents: input.countedCashCents, differenceCents } });
    return this.getShiftSummary(shiftId);
  }

  async getShiftSummary(shiftId: string): Promise<CashShiftSummaryDto> {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: {
        register: true,
        openedBy: true,
        closedBy: true,
        movements: true,
        payments: { include: { details: true } },
      },
    });
    if (!shift) throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Turno no encontrado.");

    let cashSalesCents = 0;
    let cardSalesCents = 0;
    let transferSalesCents = 0;
    for (const payment of shift.payments) {
      for (const detail of payment.details) {
        if (detail.method === "CASH") cashSalesCents += detail.amountCents;
        else if (detail.method === "CARD") cardSalesCents += detail.amountCents;
        else transferSalesCents += detail.amountCents;
      }
    }
    const totalSalesCents = cashSalesCents + cardSalesCents + transferSalesCents;

    const cashInCents = shift.movements.filter((m) => m.type === "CASH_IN").reduce((s, m) => s + m.amountCents, 0);
    const cashOutCents = shift.movements.filter((m) => m.type === "CASH_OUT").reduce((s, m) => s + m.amountCents, 0);
    const refundsCashCents = 0; // REFUNDED no implementado como reverso de efectivo automático en v1.

    const expectedCashCents = computeExpectedCash({
      openingFloatCents: shift.openingFloatCents,
      cashSalesCents,
      cashInCents,
      cashOutCents,
      refundsCashCents,
    });

    return {
      id: shift.id,
      registerId: shift.registerId,
      registerName: shift.register.name,
      status: shift.status,
      openingFloatCents: shift.openingFloatCents,
      openedByName: shift.openedBy.fullName,
      openedAt: shift.openedAt.toISOString(),
      closedByName: shift.closedBy?.fullName ?? null,
      closedAt: shift.closedAt?.toISOString() ?? null,
      totalSalesCents,
      cashSalesCents,
      cardSalesCents,
      transferSalesCents,
      cashInCents,
      cashOutCents,
      refundsCashCents,
      expectedCashCents,
      countedCashCents: shift.countedCashCents,
      differenceCents: shift.differenceCents,
    };
  }
}
