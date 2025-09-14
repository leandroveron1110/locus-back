import { CreateOfferedServiceDto } from '../dtos/Request/create-offered-service.dto';
import { UpdateOfferedServiceDto } from '../dtos/Request/update-offered-service.dto';
import { OfferedServiceResponseDto } from '../dtos/Response/offered-service-response.dto';

export interface IOfferedServiceService {
  create(
    createOfferedServiceDto: CreateOfferedServiceDto,
  ): Promise<OfferedServiceResponseDto>;
  findAll(
    businessId?: string,
    isActive?: boolean,
  ): Promise<OfferedServiceResponseDto[]>;
  findOne(id: string): Promise<OfferedServiceResponseDto>;
  findByBusinessId(businessId: string): Promise<OfferedServiceResponseDto[]>;
  update(
    id: string,
    updateOfferedServiceDto: UpdateOfferedServiceDto,
  ): Promise<OfferedServiceResponseDto>;
  remove(id: string): Promise<void>;
}
