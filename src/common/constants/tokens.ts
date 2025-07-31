// src/common/constants/tokens.ts
export const TOKENS = {
  // Servicios de Dominio

  //Moule Search
  ISearchService: Symbol('ISearchService'),
  ISearchableBusinessCrudService: Symbol('ISearchableBusinessCrudService'),
  ISearchableTagCrudService: Symbol('ISearchableTagCrudService'),
  ISearchCategoryCrudService: Symbol('ISearchableCategoryCrudService'),
  ISearchableWeeklyScheduleCrudService: Symbol('ISearchablehWeeklyScheduleCrudService'),

  // Module Users
  IUserService: Symbol('IUserService'),

  // Module Auth
  IAuthService: Symbol('IAuthService'),

  // Module Category
  ICategoryService: Symbol('ICategoryService'),

  // Module Tag
  ITagService: Symbol('ITagService'),

  // Module Status
  IStatusService: Symbol('IStatusService'),

  //Module Image
  IImageService: Symbol('IImageService'),

  // Module Business
  IBusinessService: Symbol('IBusinessService'),
  // association to Business
  IBusinessGalleryService: Symbol('IBusinessGalleryService'),
  IBusinessCategoryService: Symbol('IBusinessCategoryService'),
  IBusinessLogoService: Symbol('IBusinessLogoService'),
  IBusinessTagService: Symbol('IBusinessTagService'),


  // Module Follower
  IFollowerService: Symbol('IFollowerService'),

  // Module Menu
  IMenuService: Symbol('IMenuService'),
  ISeccionService: Symbol('ISeccionService'),
  IMenuProductService: Symbol('IMenuProductService'),

  // Module Product
  IProductService: Symbol('IProductService'),

  // Module Booking
  IBookingService: Symbol('IBookingService'),

  // Module Order
  IOrderService: Symbol('IOrderService'),

  // Module Event
  IEventService: Symbol('IEventService'),

  // Module Offered Service
  IOfferedServiceSerice: Symbol('IOfferedServiceService'),

  // Module OfferedService
  IWeeklyScheduleService: Symbol('WeeklyScheduleService'),

  // Proveedores de Capacidad Técnica
  IStorageProvider: Symbol('IStorageProvider'),

  // Validator
  IBusinessValidator: Symbol('IBusinessValidator'),
  ICategoryValidator: Symbol('ICategoryValidator'),
  IStatusValidator: Symbol('IStatusValidator'),
  ITagValidator: Symbol('ITagValidator'),
  IUserValidator: Symbol('IUserValidator'),
  IMenuValidator: Symbol('IMenuValidator'),
  ISeccionValidator: Symbol('ISeccionValidator'),
};
