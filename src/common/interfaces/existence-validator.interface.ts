// src/common/interfaces/existence-validator.interface.ts

export interface IExistenceValidator {
  checkOne(id: string): Promise<void>;
  checkMany(ids: string[]): Promise<void>;
}
