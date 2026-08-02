import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = PrismaClient | Prisma.TransactionClient;

export async function recordAudit(
  tx: Tx,
  params: {
    action: string;
    entityType: string;
    entityId?: string | null;
    userId?: string | null;
    metadata?: Record<string, unknown> | null;
  },
): Promise<void> {
  await tx.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      userId: params.userId ?? null,
      metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}
