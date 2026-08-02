import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { auditLogQuerySchema, type AuditLogDto } from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("audit")
@UseGuards(JwtAuthGuard)
@RequirePermission("AUDIT_VIEW")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: unknown): Promise<{ items: AuditLogDto[]; page: number; pageSize: number; total: number }> {
    const input = auditLogQuerySchema.parse(query);
    const where = {
      ...(input.entityType ? { entityType: input.entityType } : {}),
      ...(input.userId ? { userId: input.userId } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userName: log.user?.fullName ?? null,
        metadata: log.metadata as Record<string, unknown> | null,
        createdAt: log.createdAt.toISOString(),
      })),
      page: input.page,
      pageSize: input.pageSize,
      total,
    };
  }
}
