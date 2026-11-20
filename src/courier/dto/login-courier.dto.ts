// dto/login-courier.dto.ts
import { IsNotEmpty, IsString } from "class-validator";

export class LoginCourierDto {
  @IsString()
  @IsNotEmpty()
  dni!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}