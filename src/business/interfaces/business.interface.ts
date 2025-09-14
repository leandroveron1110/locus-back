import { Business, Prisma } from '@prisma/client';
import { CreateBusinessDto } from '../dto/Request/create-business.dto';
import {
  BusinessPreviewDto,
  BusinessResponseDto,
} from '../dto/Response/business-response.dto';
import { UpdateBusinessDto } from '../dto/Request/update-business.dto';
import { ModulesConfig } from '../dto/Request/modules-config.schema.dto';

export interface IBusinessService {
  create(dto: CreateBusinessDto): Promise<BusinessResponseDto>;

  findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.BusinessWhereUniqueInput;
    where?: Prisma.BusinessWhereInput;
    orderBy?: Prisma.BusinessOrderByWithRelationInput;
  }): Promise<any[]>;

  findAllPreview(): Promise<BusinessPreviewDto[]>;

  findOne(businessId: string): Promise<any>;

  findForOrder(id: string): Promise<any>;

  findByOwner(owenrId: string): Promise<Business[]>;

  findOneProfileById(id: string): Promise<any>;

  update(id: string, dto: UpdateBusinessDto): Promise<any>;

  remove(id: string): Promise<any>;

  updateModulesConfig(
    businessId: string,
    modulesConfig: Prisma.JsonValue,
  ): Promise<{ id: string; modulesConfig: Prisma.JsonValue }>;

  getModulesConfigByBusinessId(businessId: string): Promise<ModulesConfig>;

  findManyByIds(businessIds: string[]): Promise<any[]>;
}
