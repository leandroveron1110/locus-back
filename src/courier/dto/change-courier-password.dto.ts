// dto/change-courier-password.dto.ts
import { IsString, MinLength } from "class-validator";

export class ChangeCourierPasswordDto {
  @IsString()
  @MinLength(6)
  newPassword!: string;
}