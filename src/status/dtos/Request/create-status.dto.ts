import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStatusDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Nombre técnico/clave del estado (ej. "ACTIVE", "PENDING_REVIEW")

  @IsString()
  @IsNotEmpty()
  displayName: string; // Nombre amigable para mostrar en la UI (ej. "Activo", "Pendiente de Revisión")

  @IsOptional()
  @IsString()
  description?: string; // Descripción detallada del estado

  @IsString()
  @IsNotEmpty()
  // Tipo de entidad a la que aplica este estado (ej. "BUSINESS", "ORDER", "USER", "BOOKING")
  entityType: string;

  @IsOptional()
  @IsBoolean()
  isFinal?: boolean = false; // Indica si es un estado final (ej. "COMPLETED", "CANCELLED")

  @IsOptional()
  @Type(() => Number) // Asegura que el valor se transforme a número
  @IsInt()
  @Min(0) // El orden no puede ser negativo
  order?: number = 0; // Orden de visualización
}