// dtos/request/create-menu-product-image.dto.ts
import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';

export class CreateMenuProductImageDto {
  @IsUUID()
  menuProductId: string;

  @IsUUID()
  imageId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
