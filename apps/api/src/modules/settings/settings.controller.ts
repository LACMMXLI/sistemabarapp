import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { updateAppSettingsSchema, type AppSettingsDto } from "@barapp/contracts";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser, type AuthUserParam } from "../../common/decorators/current-user.decorator";
import { SettingsService } from "./settings.service";

@Controller("settings")
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get(): Promise<AppSettingsDto> {
    return this.settingsService.get();
  }

  @Patch()
  @RequirePermission("SETTINGS_MANAGE")
  update(@Body() body: unknown, @CurrentUser() actor: AuthUserParam): Promise<AppSettingsDto> {
    return this.settingsService.update(updateAppSettingsSchema.parse(body), actor);
  }
}
