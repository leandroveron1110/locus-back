// src/modules/business/dto/Request/update-modules-config.dto.ts
import { Prisma } from '@prisma/client'; // Importa Prisma para el tipo JsonValue
import { IsObject } from 'class-validator';

export class UpdateModulesConfigDto {
  @IsObject()
  modulesConfig: Prisma.JsonValue;
}