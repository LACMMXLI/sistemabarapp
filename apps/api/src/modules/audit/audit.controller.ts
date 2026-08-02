import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { auditLogQuerySchema, type AuditLogDto, type AuditLogList } from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("audit")
@UseGuards(JwtAuthGuard)
@RequirePermission("AUDIT_VIEW")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: unknown): Promise<AuditLogList> {
    const input = auditLogQuerySchema.parse(query);

    const where: Prisma.AuditLogWhereInput = {
      ...(input.entityType ? { entityType: input.entityType } : {}),
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.action ? { action: input.action } : {}),
      ...(input.from || input.to
        ? {
            createdAt: {
              ...(input.from ? { gte: new Date(input.from) } : {}),
              ...(input.to ? { lte: new Date(input.to) } : {}),
            },
          }
        : {}),
      ...(input.search
        ? {
            OR: [
              { action: { contains: input.search, mode: "insensitive" } },
              { entityType: { contains: input.search, mode: "insensitive" } },
              { entityId: { contains: input.search, mode: "insensitive" } },
              { user: { fullName: { contains: input.search, mode: "insensitive" } } },
            ],
          }
        : {}),
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
      items: items.map((log): AuditLogDto => ({
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
