import { User } from '@prisma/client';
import { CreateUserDto } from '../dto/Request/create-user.dto';
import { UpdateUserDto } from '../dto/Request/update-user.dto';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';

export interface IUserService {
  create(data: CreateUserDto): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<User>;
}

export interface IUserValidator extends IExistenceValidator {
  existBusinessAndOwner(businessId: string, owenerId: string): Promise<void>
}