import { PartialType } from '@nestjs/mapped-types';
import { CreateImageDto } from './create-image.dto';

// PartialType hace que todas las propiedades de CreateImageDto sean opcionales
export class UpdateImageDto extends PartialType(CreateImageDto) {}