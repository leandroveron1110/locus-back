// courier.module.ts
import { Module } from "@nestjs/common";
import { CourierCommandService } from "./courier-command.service";
import { CourierController } from "./courier.controller";
import { CourierQueryService } from "./courier-query.service";

@Module({
  controllers: [CourierController],
  providers: [CourierCommandService, CourierQueryService],
  exports: [CourierCommandService, CourierQueryService],
})
export class CourierModule {}