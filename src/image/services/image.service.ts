// src/modules/image/image.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessService } from 'src/business/services/business.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateImageDto, ImageType } from '../dtos/Request/create-image.dto';
import { ImageResponseDto } from '../dtos/Response/image-response.dto';
import { UpdateImageDto } from '../dtos/Request/update-image.dto';


@Injectable()
export class ImageService {
  constructor(
    private prisma: PrismaService,
    private businessService: BusinessService, // Inyecta BusinessService
  ) {}

  /**
   * Crea una nueva imagen asociada a un negocio.
   * @param createImageDto Datos para crear la imagen.
   * @returns La imagen creada.
   */
  async create(createImageDto: CreateImageDto): Promise<ImageResponseDto> {
    const { businessId, ...data } = createImageDto;

    // 1. Validar que el negocio exista
    await this.businessService.findOne(businessId); // Esto lanzará NotFoundException si no existe

    // 2. Si el tipo es 'logo', asegurar que no haya otro logo para este negocio
    if (data.type === 'logo') {
      const existingLogo = await this.prisma.image.findFirst({
        where: {
          businessId: businessId,
          type: 'logo',
        },
      });

      if (existingLogo) {
        // Podrías actualizar el logo existente o lanzar una excepción
        // Por simplicidad, aquí lo actualizaremos si ya existe
        return this.update(existingLogo.id, { url: data.url, provider: data.provider });
        // O podrías lanzar un error: throw new ConflictException('Business already has a logo.');
      }
    }

    const image = await this.prisma.image.create({
      data: {
        ...data,
        business: {
          connect: { id: businessId }, // Conecta la imagen al negocio existente
        },
      },
    });
    return ImageResponseDto.fromPrisma(image);
  }

  /**
   * Obtiene todas las imágenes, opcionalmente filtradas por negocio.
   * @param businessId (Opcional) ID del negocio para filtrar.
   * @returns Lista de imágenes.
   */
  async findAll(businessId?: string): Promise<ImageResponseDto[]> {
    const images = await this.prisma.image.findMany({
      where: {
        businessId: businessId, // Aplica el filtro si businessId está presente
      },
    });
    return images.map(ImageResponseDto.fromPrisma);
  }

  /**
   * Obtiene una imagen por su ID.
   * @param id ID de la imagen.
   * @returns La imagen encontrada.
   * @throws NotFoundException Si la imagen no se encuentra.
   */
  async findOne(id: string): Promise<ImageResponseDto> {
    const image = await this.prisma.image.findUnique({
      where: { id },
    });
    if (!image) {
      throw new NotFoundException(`Image with ID "${id}" not found.`);
    }
    return ImageResponseDto.fromPrisma(image);
  }

  /**
   * Obtiene todas las imágenes de galería para un negocio específico.
   * @param businessId ID del negocio.
   * @returns Lista de imágenes de galería ordenadas.
   * @throws NotFoundException Si el negocio no existe.
   */
  async findGalleryImagesByBusinessId(businessId: string): Promise<ImageResponseDto[]> {
    await this.businessService.findOne(businessId); // Valida que el negocio exista

    const images = await this.prisma.image.findMany({
      where: {
        businessId: businessId,
        type: ImageType.GALLERY,
      },
      orderBy: {
        order: 'asc', // Ordena por el campo 'order'
      },
    });
    return images.map(ImageResponseDto.fromPrisma);
  }

  /**
   * Obtiene la imagen de logo para un negocio específico.
   * @param businessId ID del negocio.
   * @returns La imagen de logo o null si no existe.
   */
  async findLogoImageByBusinessId(businessId: string): Promise<ImageResponseDto | null> {
    await this.businessService.findOne(businessId); // Valida que el negocio exista

    const logo = await this.prisma.image.findFirst({
      where: {
        businessId: businessId,
        type: ImageType.LOGO,
      },
    });
    return logo ? ImageResponseDto.fromPrisma(logo) : null;
  }

  /**
   * Actualiza una imagen existente.
   * @param id ID de la imagen a actualizar.
   * @param updateImageDto Datos para actualizar la imagen.
   * @returns La imagen actualizada.
   * @throws NotFoundException Si la imagen no se encuentra.
   */
  async update(id: string, updateImageDto: UpdateImageDto): Promise<ImageResponseDto> {
    // Opcional: Si updateImageDto.businessId está presente, podrías validar el nuevo negocio
    if (updateImageDto.businessId) {
      await this.businessService.findOne(updateImageDto.businessId);
    }

    try {
      const updatedImage = await this.prisma.image.update({
        where: { id },
        data: updateImageDto,
      });
      return ImageResponseDto.fromPrisma(updatedImage);
    } catch (error) {
      // Manejo específico para el caso de que la imagen no exista
      if (error.code === 'P2025') { // Código de error de Prisma para 'record not found'
        throw new NotFoundException(`Image with ID "${id}" not found.`);
      }
      throw error; // Propagar otros errores
    }
  }

  /**
   * Elimina una imagen.
   * @param id ID de la imagen a eliminar.
   * @throws NotFoundException Si la imagen no se encuentra.
   */
  async remove(id: string): Promise<void> {
    try {
      await this.prisma.image.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Image with ID "${id}" not found.`);
      }
      throw error;
    }
  }
}