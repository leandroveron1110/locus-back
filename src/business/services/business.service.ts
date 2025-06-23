import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client'; // Para tipos de Prisma como JsonValue y WhereInput
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBusinessDto } from '../dto/Request/create-business.dto';
import { UpdateBusinessDto } from '../dto/Request/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    private prisma: PrismaService,
    // NO inyectamos StatusService, CategoryService, TagService, ImageService aquí.
    // La gestión de esas relaciones se hará a través de otros servicios o controladores específicos.
  ) {}

  /**
   * Crea un nuevo negocio en la base de datos.
   * El estado inicial, las categorías, tags e imágenes se manejan externamente o en el controlador.
   */
  async create(createBusinessDto: CreateBusinessDto) {
    const { ownerId, categoryId, modulesConfig, ...data } = createBusinessDto;

    try {
      const business = await this.prisma.business.create({
        data: {
          ...data,
          // Conectar relaciones usando solo los IDs que recibe.
          // La validez de ownerId y categoryId debería ser verificada por el controlador
          // o un servicio de coordinación llamando a UserService y CategoryService.
          owner: { connect: { id: ownerId } },
          category: { connect: { id: categoryId } },
          modulesConfig: modulesConfig || {}, // Asegura que modulesConfig sea un objeto, por defecto vacío
          // NO se manejan 'currentStatus', 'tags', 'images' aquí directamente en la creación,
          // ya que esas son responsabilidades de otros servicios o de operaciones posteriores.
        },
        // En la respuesta de creación, solo incluimos lo estrictamente core del Business
        // Si necesitas Category o Owner en la respuesta, puedes incluirlos,
        // pero recuerda que en microservicios, estos vendrían de otras llamadas.
        include: {
          category: true, // Incluido solo si es muy esencial para la respuesta de creación
          // owner: true, // Idealmente, se obtiene del UserService
        },
      });
      return business;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2003: Foreign key constraint failed (ej. ownerId o categoryId no existen)
        if (error.code === 'P2003') {
          throw new NotFoundException(
            'ID de propietario o categoría no válido. Asegúrese de que existan.',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Obtiene una lista de negocios. Las relaciones como tags, images, etc., NO se incluyen.
   * Si se necesitan, el consumidor debe hacer llamadas adicionales a los servicios correspondientes.
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.BusinessWhereUniqueInput;
    where?: Prisma.BusinessWhereInput;
    orderBy?: Prisma.BusinessOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.business.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      // Solo incluimos relaciones que son CORE para el Negocio y no son opcionales/modulares
      // o que son esenciales para un lookup mínimo (como la categoría asociada al ID).
      // NO INCLUIMOS: owner, tags, images, currentStatus, weeklySchedules, etc.
      include: {
        category: true, // La categoría es parte del perfil base del negocio
      },
    });
  }

  /**
   * Busca un único negocio por su ID.
   * Similar a findAll, solo devuelve la información core del negocio.
   */
  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        category: true, // La categoría es parte del perfil base del negocio
      },
    });
    if (!business) {
      throw new NotFoundException(`Negocio con ID "${id}" no encontrado.`);
    }
    return business;
  }

  /**
   * Actualiza la información core de un negocio existente.
   * La actualización de tags, imágenes, estado o propietario se maneja en otros servicios.
   */
  async update(id: string, updateBusinessDto: UpdateBusinessDto) {
    const { modulesConfig, ...rest } = updateBusinessDto;

    const dataToUpdate: Prisma.BusinessUpdateInput = {
      ...rest,
      ...(modulesConfig !== undefined && {
        modulesConfig: modulesConfig as Prisma.InputJsonValue,
      }),
    };
    try {
      const updatedBusiness = await this.prisma.business.update({
        where: { id },
        data: dataToUpdate,
        include: {
          category: true, // Se incluye para la respuesta
        },
      });
      return updatedBusiness;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `No se pudo actualizar el negocio con ID "${id}".`,
          );
        }
        if (error.code === 'P2003') {
          // Foreign key constraint failed
          throw new NotFoundException(
            'ID de categoría o propietario no válido para la actualización.',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Elimina un negocio del core. Las entidades relacionadas (imágenes, tags, etc.)
   * deben ser gestionadas por sus respectivos servicios (si no hay onDelete: Cascade).
   */
  async remove(id: string) {
    try {
      // Si tienes onDelete: Cascade en tu schema para Image, Prisma las eliminará.
      // Para otras relaciones (ej. tags, status), sus servicios respectivos
      // deberían gestionar la limpieza o el desenlace de la relación.
      return await this.prisma.business.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Negocio con ID "${id}" no encontrado para eliminar.`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Actualiza la configuración de módulos opcionales para un negocio.
   * Esto SÍ es parte del core del negocio.
   */
  async updateModulesConfig(
    businessId: string,
    modulesConfig: Prisma.JsonValue,
  ) {
    try {
      return await this.prisma.business.update({
        where: { id: businessId },
        data: {
          modulesConfig: modulesConfig as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          modulesConfig: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Negocio con ID "${businessId}" no encontrado para actualizar la configuración de módulos.`,
          );
        }
      }
      throw error;
    }
  }
}
