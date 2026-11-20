// dto/set-working-state.dto.ts
import { IsBoolean } from "class-validator";

export class SetWorkingStateDto {
  @IsBoolean()
  isAvailable!: boolean;
}