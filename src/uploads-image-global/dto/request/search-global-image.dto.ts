import { IsOptional, IsString } from 'class-validator';

export class FindGlobalImagesQueryDto {
  @IsOptional()
  @IsString()
  lastSyncTime?: string;

  @IsOptional()
  @IsString()
  query?: string;
}
