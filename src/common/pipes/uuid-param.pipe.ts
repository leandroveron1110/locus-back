// src/common/pipes/uuid-param.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate as isUUID } from 'uuid'; // Importa la función de validación de uuid

@Injectable()
export class UuidParam implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value)) {
      throw new BadRequestException(`El ID "${value}" no es un UUID válido.`);
    }
    return value;
  }
}
