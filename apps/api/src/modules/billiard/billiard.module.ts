import { Module } from "@nestjs/common";
import { BilliardController } from "./billiard.controller";
import { BilliardService } from "./billiard.service";

@Module({
  controllers: [BilliardController],
  providers: [BilliardService],
})
export class BilliardModule {}
