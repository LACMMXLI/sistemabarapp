import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = PrismaClient | Prisma.TransactionClient;

/** Recalcula subtotal/descuento/total a partir de los renglones vivos de la orden. */
export async function recomputeOrderTotals(tx: Tx, orderId: string): Promise<void> {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
  const items = await tx.orderItem.findMany({ where: { orderId, cancelledAt: null } });

  const subtotalCents = items.reduce((sum, i) => sum + i.basePriceCents * i.quantity, 0);
  const discountCents = items.reduce((sum, i) => sum + i.discountCents * i.quantity, 0);
  const totalCents = subtotalCents - discountCents + order.billiardChargeCents;

  await tx.order.update({
    where: { id: orderId },
    data: { subtotalCents, discountCents, totalCents, version: { increment: 1 } },
  });
}
