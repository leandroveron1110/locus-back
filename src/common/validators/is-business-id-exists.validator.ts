// src/common/validators/is-business-id-exists.validator.ts
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Injectable, Inject } from '@nestjs/common';
import { IBusinessService } from 'src/business/interfaces/business.interface';
import { TOKENS } from 'src/common/constants/tokens';

// Para que NestJS pueda inyectar dependencias en el validador
@ValidatorConstraint({ async: true })
@Injectable()
export class IsBusinessIdExistsConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    @Inject(TOKENS.IBusinessService) // Inyecta tu servicio de negocio
    private businessService: IBusinessService,
  ) {}

  async validate(businessId: string, args: ValidationArguments) {
    console.log(businessId)
    if (!businessId) {
      return true; // Si el campo es opcional y no está presente, considera válido aquí.
      // Si es obligatorio, @IsNotEmpty o @IsUUID lo capturarán antes.
    }
    try {
      await this.businessService.findOne(businessId);
      return true; // El negocio existe
    } catch (error) {
      // Si findOne lanza NotFoundException, significa que no existe.
      // Podrías manejar otros errores aquí si es necesario.
      return false; // El negocio no existe
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `Business with ID "${args.value}" does not exist.`;
  }
}

// Decorador para usar en tus DTOs
export function IsBusinessIdExists(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBusinessIdExistsConstraint,
    });
  };
}
