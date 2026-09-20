export interface CashRegisterResponseDto {
  id: string;

  /**
   * Identidad generada por el cliente.
   *
   * Se utiliza para sincronización e idempotencia.
   */
  idTemp: string | null;

  businessId: string;

  name: string;

  /**
   * ID definitivo de la cuenta de tesorería.
   */
  defaultTreasuryAccountId: string;

  /**
   * ID temporal de la cuenta de tesorería.
   *
   * Permite que los clientes trabajen siempre
   * con idTemp para reconciliación offline.
   */
  defaultTreasuryAccountIdTemp: string;

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;
}