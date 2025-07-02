import { EntityType } from 'src/common/enums/entity-type.enum';
import { CreateStatusDto } from '../dtos/Request/create-status.dto';
import { StatusResponseDto } from '../dtos/Response/status-response.dto';
import { UpdateStatusDto } from '../dtos/Request/update-status.dto';

export interface IStatusService {
  create(createStatusDto: CreateStatusDto): Promise<StatusResponseDto>;
  findAll(entityType?: EntityType): Promise<StatusResponseDto[]>;
  findOne(id: string): Promise<StatusResponseDto>;
  findByNameAndEntityType(
    name: string,
    entityType: EntityType,
  ): Promise<StatusResponseDto>;
  update(
    id: string,
    updateStatusDto: UpdateStatusDto,
  ): Promise<StatusResponseDto>;
  remove(id: string): Promise<void>;
}
