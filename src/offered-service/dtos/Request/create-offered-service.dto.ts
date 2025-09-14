import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { IsBusinessIdExists } from 'src/common/validators/is-business-id-exists.validator';

export class CreateOfferedServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Nombre del servicio (ej. "Corte de Pelo", "Masaje Relajante")

  @IsOptional()
  @IsString()
  description?: string; // Descripción detallada del servicio

  @IsNotEmpty()
  @IsBusinessIdExists({ message: 'El negocio especificado no existe.' }) // ¡Usa el validador aquí!
  businessId: string; // El ID del negocio que ofrece este servicio

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number; // Precio del servicio (opcional, algunos servicios pueden no tener un precio fijo)

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  durationMinutes?: number; // Duración estimada en minutos (para agendamiento)

  @IsOptional()
  @IsBoolean()
  active?: boolean = true; // Indica si el servicio está activo y disponible
}