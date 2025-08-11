import { IsUUID } from 'class-validator';

export class AssignCompanyDto {
  @IsUUID()
  companyId: string;
}
