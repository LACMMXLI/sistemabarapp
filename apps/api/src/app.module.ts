import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ProductsModule } from "./modules/products/products.module";
import { TablesModule } from "./modules/tables/tables.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { PromotionsModule } from "./modules/promotions/promotions.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { BilliardModule } from "./modules/billiard/billiard.module";
import { CashModule } from "./modules/cash/cash.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { AuditModule } from "./modules/audit/audit.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    TablesModule,
    InventoryModule,
    PromotionsModule,
    OrdersModule,
    BilliardModule,
    CashModule,
    ReportsModule,
    AuditModule,
    SettingsModule,
    HealthModule,
  ],
})
export class AppModule {}
