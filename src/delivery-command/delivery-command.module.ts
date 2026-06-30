import { Module } from "@nestjs/common";
import { DeliveryCommandsService } from "./services/command/delivery-command.service";
import { DeliveryCommandsController } from "./controller/delivery-command.controller";
import { DeliveryQueriesService } from "./services/query/delivery-queries.service";

@Module({
  controllers: [
    DeliveryCommandsController
  ],
  providers: [
    DeliveryCommandsService, DeliveryQueriesService
  ],
})
export class DeliveryCommandModule {}