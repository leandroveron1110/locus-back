import { OpcionGrupo } from "@prisma/client";

export class OptionGroupResDto {
    id: string;
    name: string;
    minQuantity: number;
    maxQuantity: number;
    quantityType: string;
    menuProductId: string;
    options?: [];

    static fromPrisma(optionGroup: OpcionGrupo) {
        const dto = new OptionGroupResDto();
        dto.id = optionGroup.id;
        dto.name = optionGroup.name;
        dto.maxQuantity = optionGroup.maxQuantity;
        dto.minQuantity = optionGroup.minQuantity;
        dto.quantityType = optionGroup.quantityType;
        dto.menuProductId = optionGroup.menuProductId;
    }


}