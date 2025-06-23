import { PartialType } from '@nestjs/mapped-types'; // Necesitas 'npm install @nestjs/mapped-types'
import { CreateCategoryDto } from './create-category.dto';

// Todas las propiedades de CreateCategoryDto se vuelven opcionales aquí
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}