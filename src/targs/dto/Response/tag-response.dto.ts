import { Expose } from 'class-transformer';

export class TagResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  active: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}