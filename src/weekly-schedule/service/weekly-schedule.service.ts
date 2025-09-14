// src/modules/weekly-schedule/weekly-schedule.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWeeklyScheduleDto } from '../dtos/Request/create-weekly-schedule.dto';
import { WeeklyScheduleResponseDto } from '../dtos/Response/weekly-schedule-response.dto';
import { DayOfWeek } from '@prisma/client';
import { UpdateWeeklyScheduleDto } from '../dtos/Request/update-weekly-schedule.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IWeeklyScheduleService } from '../interface/weekly-schedule-service.interface';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';

@Injectable()
export class WeeklyScheduleService implements IWeeklyScheduleService {
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IBusinessValidator)
    private businessValidator: IExistenceValidator,
  ) {}

  /**
   * Helper para convertir string "HH:MM" a un objeto Date con esa hora.
   * La fecha no es importante, solo la hora.
   */
  private parseTimeStringToDate(timeString: string): Date {
    // Usamos una fecha base cualquiera, ej. 2000-01-01, y le seteamos la hora
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date('2000-01-01T00:00:00Z'); // Usamos UTC para evitar problemas de zona horaria
    date.setUTCHours(hours, minutes, 0, 0); // Establece la hora en UTC
    return date;
  }

  /**
   * Crea un nuevo horario semanal para un negocio.
   * @param createWeeklyScheduleDto Datos para crear el horario.
   * @returns El horario semanal creado.
   * @throws NotFoundException Si el negocio no existe.
   * @throws ConflictException Si el horario se superpone con uno existente para el mismo negocio/día.
   * @throws BadRequestException Si la hora de cierre es anterior o igual a la de apertura.
   */
  async create(
    createWeeklyScheduleDto: CreateWeeklyScheduleDto,
  ): Promise<WeeklyScheduleResponseDto> {
    const { businessId, dayOfWeek, openingTime, closingTime } =
      createWeeklyScheduleDto;

    await this.businessValidator.checkOne(businessId);

    const parsedOpeningTime = this.parseTimeStringToDate(openingTime);
    const parsedClosingTime = this.parseTimeStringToDate(closingTime);

    // 2. Validar que la hora de cierre no sea anterior o igual a la de apertura
    if (parsedClosingTime <= parsedOpeningTime) {
      throw new BadRequestException('Closing time must be after opening time.');
    }

    try {
      const schedule = await this.prisma.weeklySchedule.create({
        data: {
          businessId: businessId,
          dayOfWeek,
          openingTime: parsedOpeningTime,
          closingTime: parsedClosingTime,
        },
      });
      console.log(businessId);
      return WeeklyScheduleResponseDto.fromPrisma(schedule);
    } catch (error) {
      // Manejo de errores específicos de Prisma
      if (error.code === 'P2002') {
        // Unique constraint violation
        throw new ConflictException(
          `A schedule for business ${businessId} on ${dayOfWeek} with times ${openingTime}-${closingTime} already exists.`,
        );
      }
      throw error; // Propagar otros errores
    }
  }

  /**
   * Obtiene todos los horarios semanales, opcionalmente filtrados por negocio o día.
   * @param businessId (Opcional) ID del negocio.
   * @param dayOfWeek (Opcional) Día de la semana.
   * @returns Lista de horarios semanales.
   */
  async findAll(
    businessId?: string,
    dayOfWeek?: DayOfWeek,
  ): Promise<WeeklyScheduleResponseDto[]> {
    const schedules = await this.prisma.weeklySchedule.findMany({
      where: {
        businessId: businessId,
        dayOfWeek: dayOfWeek,
      },
      orderBy: [
        { dayOfWeek: 'asc' }, // Ordenar por día de la semana
        { openingTime: 'asc' }, // Luego por hora de apertura
      ],
    });
    return schedules.map(WeeklyScheduleResponseDto.fromPrisma);
  }

  async findAllW(): Promise<WeeklyScheduleResponseDto[]> {
    const shcedules = await this.prisma.weeklySchedule.findMany();

    return shcedules.map(WeeklyScheduleResponseDto.fromPrisma);
  }

  /**
   * Obtiene un horario semanal por su ID.
   * @param id ID del horario.
   * @returns El horario encontrado.
   * @throws NotFoundException Si el horario no se encuentra.
   */
  async findOne(id: string): Promise<WeeklyScheduleResponseDto> {
    const schedule = await this.prisma.weeklySchedule.findUnique({
      where: { id },
    });
    if (!schedule) {
      throw new NotFoundException(`WeeklySchedule with ID "${id}" not found.`);
    }
    return WeeklyScheduleResponseDto.fromPrisma(schedule);
  }

  /**
   * Obtiene todos los horarios semanales para un negocio específico.
   * @param businessId ID del negocio.
   * @returns Lista de horarios semanales del negocio.
   * @throws NotFoundException Si el negocio no existe.
   */
  async findPanleBusinessByBusinessId(
    businessId: string,
    isValidBusiness: boolean = true,
  ): Promise<any> {
    if (isValidBusiness) await this.businessValidator.checkOne(businessId);

    const schedules = await this.prisma.weeklySchedule.findMany({
      where: { businessId },
      orderBy: [{ dayOfWeek: 'asc' }, { openingTime: 'asc' }],
      select: {
        id: true,
        dayOfWeek: true,
        openingTime: true,
        closingTime: true,
      },
    });

    // const grouped: Record<string, string[]> = {};

    type s = {
      id: string,
      dayOfWeek: string,
      openingTime: string,
      closingTime: string
    } 

    const res: s[] = []

    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    };

    for (const { id, dayOfWeek, openingTime, closingTime } of schedules) {
      const key = dayOfWeek.toUpperCase();
      res.push({
        id,
        closingTime: formatTime(closingTime),
        dayOfWeek: key,
        openingTime: formatTime(openingTime)
      })

    }

    return res;
  }

  async findByBusinessId(
    businessId: string,
    isValidBusiness: boolean = true,
  ): Promise<Record<string, string[]>> {
    if (isValidBusiness) await this.businessValidator.checkOne(businessId);

    const schedules = await this.prisma.weeklySchedule.findMany({
      where: { businessId },
      orderBy: [{ dayOfWeek: 'asc' }, { openingTime: 'asc' }],
      select: {
        dayOfWeek: true,
        openingTime: true,
        closingTime: true,
      },
    });

    const grouped: Record<string, string[]> = {};

    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    };

    for (const { dayOfWeek, openingTime, closingTime } of schedules) {
      const key = dayOfWeek.toUpperCase();
      const range = `${formatTime(openingTime)}-${formatTime(closingTime)}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(range);
    }

    return grouped;
  }

  /**
   * Actualiza un horario semanal existente.
   * @param id ID del horario a actualizar.
   * @param updateWeeklyScheduleDto Datos para actualizar el horario.
   * @returns El horario actualizado.
   * @throws NotFoundException Si el horario no se encuentra.
   * @throws ConflictException Si la actualización genera un conflicto de unicidad.
   * @throws BadRequestException Si la hora de cierre es anterior o igual a la de apertura.
   */
  async update(
    id: string,
    updateWeeklyScheduleDto: UpdateWeeklyScheduleDto,
  ): Promise<WeeklyScheduleResponseDto> {
    const { businessId, dayOfWeek, openingTime, closingTime } =
      updateWeeklyScheduleDto;

    let parsedOpeningTime: Date | undefined;
    let parsedClosingTime: Date | undefined;

    if (openingTime) {
      parsedOpeningTime = this.parseTimeStringToDate(openingTime);
    }
    if (closingTime) {
      parsedClosingTime = this.parseTimeStringToDate(closingTime);
    }

    // Validar que closingTime sea mayor que openingTime
    if (
      parsedOpeningTime &&
      parsedClosingTime &&
      parsedClosingTime <= parsedOpeningTime
    ) {
      throw new BadRequestException('Closing time must be after opening time.');
    } else if (parsedOpeningTime && !parsedClosingTime) {
      // Si solo se actualiza la apertura, verificar con el cierre actual
      const currentSchedule = await this.findOne(id);
      const currentClosingTime = this.parseTimeStringToDate(
        currentSchedule.closingTime,
      );
      if (parsedOpeningTime >= currentClosingTime) {
        throw new BadRequestException(
          'New opening time must be before current closing time.',
        );
      }
    } else if (!parsedOpeningTime && parsedClosingTime) {
      // Si solo se actualiza el cierre, verificar con la apertura actual
      const currentSchedule = await this.findOne(id);
      const currentOpeningTime = this.parseTimeStringToDate(
        currentSchedule.openingTime,
      );
      if (parsedClosingTime <= currentOpeningTime) {
        throw new BadRequestException(
          'New closing time must be after current opening time.',
        );
      }
    }

    try {
      const updatedSchedule = await this.prisma.weeklySchedule.update({
        where: { id },
        data: {
          ...updateWeeklyScheduleDto,
          openingTime: parsedOpeningTime,
          closingTime: parsedClosingTime,
        },
      });
      return WeeklyScheduleResponseDto.fromPrisma(updatedSchedule);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `WeeklySchedule with ID "${id}" not found.`,
        );
      }
      if (error.code === 'P2002') {
        // Unique constraint violation
        // Obtener el horario actual para construir un mensaje más específico
        const currentSchedule = await this.findOne(id).catch(() => null); // Si el ID no existe, atrapa el error
        const day =
          updateWeeklyScheduleDto.dayOfWeek || currentSchedule?.dayOfWeek;
        const opTime =
          updateWeeklyScheduleDto.openingTime || currentSchedule?.openingTime;
        const clTime =
          updateWeeklyScheduleDto.closingTime || currentSchedule?.closingTime;
        throw new ConflictException(
          `A schedule for business ${businessId} on ${day} with times ${opTime}-${clTime} already exists.`,
        );
      }
      throw error;
    }
  }

  /**
   * Elimina un horario semanal.
   * @param id ID del horario a eliminar.
   * @throws NotFoundException Si el horario no se encuentra.
   */
  async remove(id: string): Promise<void> {
    try {
      await this.prisma.weeklySchedule.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `WeeklySchedule with ID "${id}" not found.`,
        );
      }
      throw error;
    }
  }
}
