export interface ISearchableTagCrudService {
  addTagToBusiness(idBusiness: string, newTags: string[]): Promise<void>;
  deleteTagToBusiness(idBusiness: string, tagNames: string[]): Promise<void>;
  setTagsForBusiness(idBusiness: string, tags: string[]): Promise<void>;
}
