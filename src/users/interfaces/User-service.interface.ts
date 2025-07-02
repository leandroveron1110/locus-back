import { User } from '@prisma/client';
import { CreateUserDto } from '../dto/Request/create-user.dto';
import { UpdateUserDto } from '../dto/Request/update-user.dto';

export interface IUserService {
  create(data: CreateUserDto): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<User>;
}
