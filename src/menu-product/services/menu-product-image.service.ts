// services/menu-product-image.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateMenuProductImageDto } from '../dtos/request/menu-product-image-request.dto';

@Injectable()
export class MenuProductImageService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(dto: CreateMenuProductImageDto) {
    return this.prisma.menuProductImage.create({ data: dto });
  }

  async remove(menuProductId: string, imageId: string) {
    return this.prisma.menuProductImage.delete({
      where: {
        menuProductId_imageId: {
          menuProductId,
          imageId,
        },
      },
    });
  }
}
