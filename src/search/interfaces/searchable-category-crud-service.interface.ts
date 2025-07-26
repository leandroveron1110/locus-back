export interface ISearchableCategoryCrudService {
  addCategoryToBusiness(
    idBusiness: string,
    newCategories: string[],
  ): Promise<void>;
  deleteCategoryToBusiness(
    idBusiness: string,
    categoryNames: string[],
  ): Promise<void>;
  setCategoriesForBusiness(
    idBusiness: string,
    categories: string[],
  ): Promise<void>;
}
