import { Prisma } from "@prisma/client";
import { CreateBusinessDto } from "../dto/Request/create-business.dto";
import { BusinessPreviewDto, BusinessResponseDto } from "../dto/Response/business-response.dto";
import { UpdateBusinessDto } from "../dto/Request/update-business.dto";

export interface IBusinessService {
  create(dto: CreateBusinessDto): Promise<BusinessResponseDto>;

  findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.BusinessWhereUniqueInput;
    where?: Prisma.BusinessWhereInput;
    orderBy?: Prisma.BusinessOrderByWithRelationInput;
  }): Promise<any[]>;

  findAllPreview(): Promise<BusinessPreviewDto[]>

  findOne(id: string): Promise<any>;

  update(id: string, dto: UpdateBusinessDto): Promise<any>;

  remove(id: string): Promise<any>;

  updateModulesConfig(
    businessId: string,
    modulesConfig: Prisma.JsonValue,
  ): Promise<{ id: string; modulesConfig: Prisma.JsonValue }>;
}
