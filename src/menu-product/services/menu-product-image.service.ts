// services/menu-product-image.service.ts
import { Injectable } from '@nestjs/common';
import { CreateMenuProductImageDto } from '../dtos/request/menu-product-image-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MenuProductImageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMenuProductImageDto) {
    return await this.prisma.menuProductImage.create({ data: {
      url: dto.url,
      menuProductId: dto.menuProductId,
      order: dto.order
    } });
  }

  async remove(menuProductId: string, imageId: string) {
    return true;
  }
}
