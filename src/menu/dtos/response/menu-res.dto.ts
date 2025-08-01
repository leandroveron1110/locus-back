import { MenuSectionWithProductsDto } from "./seccion-res.dto";


export class MenuWithSectionsDto {
  id: string;
  businessId: string;
  name: string;
  sections: MenuSectionWithProductsDto[];
}
