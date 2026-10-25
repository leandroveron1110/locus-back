import { Module } from "@nestjs/common";
import { DeliveryCommandsService } from "./services/command/delivery-command.service";
import { DeliveryCommandsController } from "./controller/delivery-command.controller";
import { DeliveryQueriesService } from "./services/query/delivery-queries.service";
import { DeliveryCommandsV2Controller } from "./controller/delivery-commands-v2.controller";
import { DeliveryCommandsV2Service } from "./services/command/delivery-queries-v2.service";
import { DeliveryQueriesV2Service } from "./services/query/delivery-queries-v2.service";

@Module({
  controllers: [
    DeliveryCommandsController, DeliveryCommandsV2Controller
  ],
  providers: [
    DeliveryCommandsService, DeliveryQueriesService, DeliveryCommandsV2Service, DeliveryQueriesV2Service
  ],
})
export class DeliveryCommandModule {}