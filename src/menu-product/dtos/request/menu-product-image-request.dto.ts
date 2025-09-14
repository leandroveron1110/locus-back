// dto/link-menu-product-image.dto.ts
import { IsUUID } from 'class-validator';

export class LinkMenuProductImageDto {
  @IsUUID()
  menuProductId: string;

  @IsUUID()
  imageId: string;
}
