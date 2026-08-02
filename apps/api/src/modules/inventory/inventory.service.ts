import { Injectable } from "@nestjs/common";
import type { CreateManualMovementInput, InventoryItemDto, InventoryMovementDto } from "@barapp/contracts";
import { ERROR_CODES } from "@barapp/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiException } from "../../common/errors/api-exception";
import { recordAudit } from "../../lib/audit";
import type { AuthenticatedUser } from "../../common/types/auth-user";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<InventoryItemDto[]> {
    const products = await this.prisma.product.findMany({
      where: { tracksInventory: true },
      include: { inventory: true },
      orderBy: { name: "asc" },
    });
    return products.map((p) => ({
      productId: p.id,
      productName: p.name,
      currentStock: p.inventory?.currentStock ?? 0,
      lowStockThreshold: p.lowStockThreshold,
      isLow: (p.inventory?.currentStock ?? 0) <= p.lowStockThreshold,
    }));
  }

  async movements(productId?: string): Promise<InventoryMovementDto[]> {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: productId ? { productId } : undefined,
      include: { product: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product.name,
      type: m.type,
      quantity: m.quantity,
      resultingStock: m.resultingStock,
      reason: m.reason,
      orderId: m.orderId,
      userName: m.user.fullName,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async createManualMovement(input: CreateManualMovementInput, actor: AuthenticatedUser): Promise<InventoryMovementDto> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: input.productId }, include: { inventory: true } });
      if (!product || !product.tracksInventory) {
        throw new ApiException(404, ERROR_CODES.NOT_FOUND, "El producto no controla inventario.");
      }
      const currentStock = product.inventory?.currentStock ?? 0;
      const delta = input.type === "ADJUSTMENT_OUT" ? -input.quantity : input.quantity;
      const resultingStock = currentStock + delta;
      if (resultingStock < 0) {
        throw new ApiException(409, ERROR_CODES.INSUFFICIENT_STOCK, "El ajuste dejaría el inventario en negativo.");
      }

      if (product.inventory) {
        await tx.inventory.update({ where: { productId: product.id }, data: { currentStock: resultingStock } });
      } else {
        await tx.inventory.create({ data: { productId: product.id, currentStock: resultingStock } });
      }

      const movement = await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type: input.type,
          quantity: delta,
          resultingStock,
          reason: input.reason,
          userId: actor.userId,
        },
      });

      await recordAudit(tx, {
        action: "INVENTORY_MANUAL_MOVEMENT",
        entityType: "InventoryMovement",
        entityId: movement.id,
        userId: actor.userId,
        metadata: { productId: product.id, type: input.type, quantity: input.quantity },
      });

      return {
        id: movement.id,
        productId: product.id,
        productName: product.name,
        type: movement.type,
        quantity: movement.quantity,
        resultingStock: movement.resultingStock,
        reason: movement.reason,
        orderId: null,
        userName: actor.username,
        createdAt: movement.createdAt.toISOString(),
      };
    });
  }
}
