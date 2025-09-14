import { CreateImageDto } from '../dtos/Request/create-image.dto';
import { UpdateImageDto } from '../dtos/Request/update-image.dto';
import { ImageResponseDto } from '../dtos/Response/image-response.dto';

export interface IImageService {
  create(dto: CreateImageDto): Promise<ImageResponseDto>;

  findAll(): Promise<ImageResponseDto[]>;

  findOne(id: string): Promise<ImageResponseDto>;

  findManyByIds(ids: string[]): Promise<ImageResponseDto[]>;

  update(id: string, dto: UpdateImageDto): Promise<ImageResponseDto>;

  remove(id: string): Promise<void>;
}
