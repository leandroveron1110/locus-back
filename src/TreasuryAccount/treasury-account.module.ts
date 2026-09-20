import { Module } from "@nestjs/common";
import { TreasuryAccountController } from "./controller/treasury-account.controller";
import { TreasuryAccountService } from "./services/treasury-account.service";

@Module({
  controllers: [TreasuryAccountController],
  providers: [TreasuryAccountService],
  imports: []
})
export class TreasuryAccountModule {}