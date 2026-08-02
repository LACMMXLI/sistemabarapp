import { Injectable } from "@nestjs/common";
import type { AppSettingsDto, UpdateAppSettingsInput } from "@barapp/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { recordAudit } from "../../lib/audit";
import type { AuthenticatedUser } from "../../common/types/auth-user";

const SETTINGS_ID = "default";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<AppSettingsDto> {
    const settings = await this.prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID, businessName: "Las Cheladas de la Once", sidebarName: "Las Cheladas de la Once" },
    });
    return toDto(settings);
  }

  async update(input: UpdateAppSettingsInput, actor: AuthenticatedUser): Promise<AppSettingsDto> {
    const settings = await this.prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: { businessName: input.businessName, sidebarName: input.sidebarName, logoUrl: input.logoUrl },
      create: {
        id: SETTINGS_ID,
        businessName: input.businessName ?? "Las Cheladas de la Once",
        sidebarName: input.sidebarName ?? "Las Cheladas de la Once",
        logoUrl: input.logoUrl ?? null,
      },
    });
    await recordAudit(this.prisma, {
      action: "SETTINGS_UPDATE",
      entityType: "AppSettings",
      entityId: SETTINGS_ID,
      userId: actor.userId,
      metadata: { changedFields: Object.keys(input) },
    });
    return toDto(settings);
  }
}

function toDto(settings: { businessName: string; sidebarName: string; logoUrl: string | null; updatedAt: Date }): AppSettingsDto {
  return {
    businessName: settings.businessName,
    sidebarName: settings.sidebarName,
    logoUrl: settings.logoUrl,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
