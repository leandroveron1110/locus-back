import { Category } from '@prisma/client';
import { CreateCategoryDto } from '../dto/Request/create-category.dto';
import { UpdateCategoryDto } from '../dto/Request/update-category.dto';
import { CategoryResponseDto } from '../dto/Response/category-response.dto';

export interface ICategoryService {
  create(createCategoryDto: CreateCategoryDto): Promise<Category>;
  createAll(createCategoryDto: CreateCategoryDto[]): Promise<Category[]>;
  findAll(): Promise<CategoryResponseDto[]>;
  findOne(id: string): Promise<Category>;
  update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category>;
  remove(id: string): Promise<Category>;
  getCategoryByIds(tagIds: string[]): Promise<Category[]>
}
