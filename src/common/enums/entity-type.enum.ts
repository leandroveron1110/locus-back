// src/common/enums/entity-type.enum.ts

/**
 * @enum EntityType
 * @description Define los tipos de entidades principales en el sistema que pueden tener estados asociados.
 * Esto asegura consistencia, seguridad de tipo y autocompletado al referenciar tipos de entidades
 * en el módulo `Status` y en otros servicios.
 */
export enum EntityType {
  BUSINESS = 'BUSINESS',
  OFFERED_SERVICE = 'OFFERED_SERVICE',
  PRODUCT = 'PRODUCT',
  EVENT = 'EVENT',
  USER = 'USER',
  CATEGORY = 'CATEGORY',
  TAG = 'TAG',
  BOOKING = 'BOOKING',
  ORDER = 'ORDER',
  // Agrega aquí cualquier otra entidad que consideres que tendrá estados gestionados por el módulo Status.
  // Por ejemplo, si tienes un plan de suscripción para negocios, podrías añadir:
  // BUSINESS_PLAN = 'BUSINESS_PLAN',
}