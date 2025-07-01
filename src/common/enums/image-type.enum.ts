// src/common/enums/image-type.enum.ts

/**
 * @enum ImageType
 * @description Define los tipos estandarizados de imágenes utilizados en la aplicación.
 * Permite categorizar las imágenes (ej. logo, galería, banner) de forma consistente.
 */
export enum ImageType {
  LOGO = 'logo',
  GALLERY = 'gallery',
  BANNER = 'banner',
  // Puedes añadir otros tipos si son necesarios para tu aplicación (ej. 'PRODUCT_IMAGE', 'EVENT_IMAGE')
  // PRODUCT = 'product', // Si un Product va a tener una imagen propia en el modelo Image
}