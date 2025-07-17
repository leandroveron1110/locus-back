import { IExistenceValidator } from "src/common/interfaces/existence-validator.interface";
import { CreateBusinessDto, UperrBusinessDto } from "../dtos/request/create-business-dto";

export interface ISearchableBusinessCrudService extends IExistenceValidator {
  create(data: CreateBusinessDto): Promise<any>; // Para la creación inicial de una entrada
  update(data: UperrBusinessDto): Promise<any>; // Para actualizaciones parciales
  delete(id: string): Promise<void>; // Para eliminar una entrada completa

}


