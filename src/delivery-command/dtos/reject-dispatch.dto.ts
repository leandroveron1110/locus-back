import { IsString, MinLength } from 'class-validator';

export class RejectDispatchDto {
  @IsString()
  commandId: string;

  @IsString()
  @MinLength(1)
  reason: string;
}