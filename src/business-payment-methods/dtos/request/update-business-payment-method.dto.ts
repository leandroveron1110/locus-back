import { PartialType } from "@nestjs/mapped-types";
import { CreateBusinessPaymentMethodDto } from "./create-business-payment-method.dto";

export class UpdateBusinessPaymentMethodDto extends PartialType(CreateBusinessPaymentMethodDto) {}