import { User } from '@prisma/client';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/response/login.dto';
import { CreateUserDto } from 'src/users/dto/Request/create-user.dto';

export interface IAuthService {
  validateUser(email: string, password: string): Promise<User | null>;

  loginClient(
    loginDto: LoginDto,
  ): Promise<{ user: LoginResponseDto; accessToken: string }>;

  loginBusiness(
    loginDto: LoginDto,
  ): Promise<{ user: LoginResponseDto; accessToken: string }>;

  loginDelivery(
    loginDto: LoginDto,
  ): Promise<{ user: LoginResponseDto; accessToken: string }>;

  getMe(userId: string): Promise<LoginResponseDto>;

  create(
    data: CreateUserDto,
  ): Promise<{ user: LoginResponseDto; accessToken: string }>;
}
