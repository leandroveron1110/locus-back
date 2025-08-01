import { MenuProductDto } from "src/menu-product/dtos/response/menu-product-response.dto";

export class MenuSectionWithProductsDto {
  id: string;
  name: string;
  imageUrls: string[];
  index: number;
  products: MenuProductDto[];
}
