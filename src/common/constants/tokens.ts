// src/common/constants/tokens.ts
export const TOKENS = {
  // Servicios de Dominio

  //Moule
  IUserService: Symbol('IUserService'),
  ICategoryService: Symbol('ICategoryService'),
  ITagService: Symbol('ITagService'),
  IStatusService: Symbol('IStatusService'),
  IImageService: Symbol('IImageService'),
  IBusinessService: Symbol('IBusinessService'),
  IMenuService: Symbol('IMenuService'),
  IProductService: Symbol('IProductService'),
  IBookingService: Symbol('IBookingService'),
  IOrderService: Symbol('IOrderService'),
  IEventService: Symbol('IEventService'),
  IOfferedServiceSerice: Symbol('IOfferedServiceService'),
  IWeeklyScheduleService: Symbol('WeeklyScheduleService'),

  // association to Business
  IBusinessGalleryService: Symbol('IBusinessGalleryService'),
  IBusinessCategoryService: Symbol('IBusinessCategoryService'),
  IBusinessLogoService: Symbol('IBusinessLogoService'),
  IBusinessTagService: Symbol('IBusinessTagService'),

  // Proveedores de Capacidad Técnica
  IStorageProvider: Symbol('IStorageProvider'),

  // Validator
  IBusinessValidator: Symbol('IBusinessValidator'),
  ICategoryValidator: Symbol('ICategoryValidator'),
  IStatusValidator: Symbol('IStatusValidator'),
  ITagValidator: Symbol('ITagValidator'),
  IUserValidator: Symbol('IUserValidator'),
};
