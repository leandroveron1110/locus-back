import { PartialType } from '@nestjs/mapped-types';
import { CreateOfferedServiceDto } from './create-offered-service.dto';

export class UpdateOfferedServiceDto extends PartialType(CreateOfferedServiceDto) {}