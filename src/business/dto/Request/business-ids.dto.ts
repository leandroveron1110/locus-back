import { IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetBusinessesDto {
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  ids: string[];
}
