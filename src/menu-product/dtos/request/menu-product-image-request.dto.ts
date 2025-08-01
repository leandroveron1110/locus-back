// dtos/request/create-menu-product-image.dto.ts
import { IsUUID, IsOptional, IsInt, Min, IsString, IsNotEmpty } from 'class-validator';

export class CreateMenuProductImageDto {
  @IsUUID()
  menuProductId: string;

  @IsString()
  imageId: string;

  @IsString()
  @IsNotEmpty()
  url: string

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
