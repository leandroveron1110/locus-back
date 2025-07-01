// src/modules/business/dto/Request/find-all-businesses.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsJSON } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllBusinessesDto {
  @ApiPropertyOptional({
    description: 'Number of records to skip.',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  skip?: number;

  @ApiPropertyOptional({
    description: 'Number of records to take.',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  take?: number;

  @ApiPropertyOptional({
    description: 'Unique identifier for pagination cursor.',
    type: String,
  })
  @IsOptional()
  @IsString()
  cursor?: string; // Para el cursor, suele ser el ID

  @ApiPropertyOptional({
    description: 'JSON string for WHERE clause (Prisma format).',
    type: String,
    example: '{"name": {"contains": "Example"}, "isActive": true}'
  })
  @IsOptional()
  @IsString()
  // @IsJSON() // Puedes descomentar esto si esperas un JSON string y quieres validarlo
  where?: string; // Lo parsearemos en el controlador o un Pipe

  @ApiPropertyOptional({
    description: 'JSON string for ORDER BY clause (Prisma format).',
    type: String,
    example: '{"createdAt": "desc"}'
  })
  @IsOptional()
  @IsString()
  // @IsJSON() // Puedes descomentar esto si esperas un JSON string y quieres validarlo
  orderBy?: string; // Lo parsearemos en el controlador o un Pipe
}

