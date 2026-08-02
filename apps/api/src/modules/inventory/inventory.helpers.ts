import type { Prisma, PrismaClient } from "@prisma/client";
import { ERROR_CODES } from "@barapp/contracts";
import { ApiException } from "../../common/errors/api-exception";

type Tx = PrismaClient | Prisma.TransactionClient;

/**
 * Descuenta inventario dentro de una transacción cuando un producto se agrega
 * a una orden (ya fue entregado físicamente). Lanza si no hay stock suficiente,
 * salvo que allowNegative esté activo.
 */
export async function deductInventoryForSale(
  tx: Tx,
  params: { productId: string; quantity: number; orderId: string; orderItemId: string; userId: string; allowNegative: boolean },
): Promise<void> {
  const inventory = await tx.inventory.findUnique({ where: { productId: params.productId } });
  if (!inventory) return; // Producto no controla inventario.

  const resultingStock = inventory.currentStock - params.quantity;
  if (resultingStock < 0 && !params.allowNegative) {
    throw new ApiException(409, ERROR_CODES.INSUFFICIENT_STOCK, "No existe inventario suficiente para agregar el producto.");
  }

  await tx.inventory.update({ where: { productId: params.productId }, data: { currentStock: resultingStock } });
  await tx.inventoryMovement.create({
    data: {
      productId: params.productId,
      type: "SALE",
      quantity: -params.quantity,
      resultingStock,
      orderId: params.orderId,
      orderItemId: params.orderItemId,
      userId: params.userId,
    },
  });
}

/** Movimiento inverso cuando se retira un producto o se cancela la orden. */
export async function reverseInventoryForSale(
  tx: Tx,
  params: { productId: string; quantity: number; orderId: string; orderItemId: string; userId: string },
): Promise<void> {
  const inventory = await tx.inventory.findUnique({ where: { productId: params.productId } });
  if (!inventory) return;

  const resultingStock = inventory.currentStock + params.quantity;
  await tx.inventory.update({ where: { productId: params.productId }, data: { currentStock: resultingStock } });
  await tx.inventoryMovement.create({
    data: {
      productId: params.productId,
      type: "SALE_REVERSAL",
      quantity: params.quantity,
      resultingStock,
      orderId: params.orderId,
      orderItemId: params.orderItemId,
      userId: params.userId,
    },
  });
}

export function computeStockStatus(tracksInventory: boolean, currentStock: number | null, lowStockThreshold: number): "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNTRACKED" {
  if (!tracksInventory || currentStock === null) return "UNTRACKED";
  if (currentStock <= 0) return "OUT_OF_STOCK";
  if (currentStock <= lowStockThreshold) return "LOW_STOCK";
  return "AVAILABLE";
}
