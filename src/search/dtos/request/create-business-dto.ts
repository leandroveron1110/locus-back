import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsJSON, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateBusinessDto {
  @IsUUID()
  @IsNotEmpty()
  id: string; // Este debe ser el ID del negocio original

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  fullDescription?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  logoUrl?: string; // URL directa del logo

  @IsOptional()
  @IsString()
  @IsJSON() // Valida que sea un string JSON
  modulesConfig?: string; // Configuración de módulos como un string JSON

  @IsNumber()
  followersCount: number = 0

  @IsOptional()
  @IsNumber()
  reviewCount?: number = 0

  @IsOptional()
  @IsNumber()
  averageRating?: number = 0;
}

export class UperrBusinessDto extends PartialType(CreateBusinessDto){

}

export class CreateTagNameDto {
  @IsString()
  tagName: string
}