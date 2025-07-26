import { Tag } from '@prisma/client';
import { CreateTagDto } from '../dto/Request/create-tag.dto';
import { UpdateTagDto } from '../dto/Request/update-tag.dto';

export interface ITagService {
  create(createTagDto: CreateTagDto): Promise<Tag>;
  createAll(createTagDto: CreateTagDto[]): Promise<Tag[]>;
  findAll(): Promise<Tag[]>;
  findOne(id: string): Promise<Tag>;
  update(id: string, updateTagDto: UpdateTagDto): Promise<Tag>;
  remove(id: string): Promise<Tag>;
  getTagsByIds(tagIds: string[]): Promise<Tag[]>
}
