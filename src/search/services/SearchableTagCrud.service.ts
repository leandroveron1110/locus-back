import { PrismaService } from 'src/prisma/prisma.service';
import { ISearchableBusinessCrudService } from '../interfaces/serach-crud-service.interface';
import { Inject, NotFoundException } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { ISearchTagCrudService } from '../interfaces/search-tag-crud-service.interface';

export class SearchTagCrudService implements ISearchTagCrudService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKENS.ISearchableBusinessCrudService)
    private readonly searchBusines: ISearchableBusinessCrudService,
  ) {}

  // add tags to business
  async addTagToBusiness(idBusiness: string, newTags: string[]): Promise<void> {
    await this.searchBusines.checkOne(idBusiness);
    const busines = await this.prisma.searchableBusiness.findUnique({
      where: { id: idBusiness },
      select: { tagNames: true },
    });

    if (!busines) {
      throw new NotFoundException(
        `Error: Business with ID: ${idBusiness} not found.`,
      );
    }

    // Get exiting tag, or an empty if none exit
    const currentTag = busines.tagNames || [];

    // combine current tag with new tags
    const combineTagName = [...new Set([...currentTag, ...newTags])];

    this.prisma.searchableBusiness.update({
      where: { id: idBusiness },
      data: { tagNames: combineTagName },
    });
  }

  // delete specifc tag from business
  async deleteTagToBusiness(
    idBusiness: string,
    tagNames: string[],
  ): Promise<void> {
    await this.searchBusines.checkOne(idBusiness);
    const business = await this.prisma.searchableBusiness.findUnique({
      where: { id: idBusiness },
      select: { tagNames: true },
    });

    if (!business) {
      throw new NotFoundException(
        `Error: Business with ID: ${idBusiness} not Found`,
      );
    }

    // Get exiting tag, or an empty if no exit
    const currentTag = business.tagNames || [];

    // Filter out the tags that are in the tagsToDelete array
    const remainingTags = currentTag.filter((tag) => !tagNames.includes(tag));

    // Update the business with the remaining tags
    await this.prisma.searchableBusiness.update({
      where: { id: idBusiness },
      data: { tagNames: remainingTags },
    });
    console.log(
      `Tags ${tagNames.join(', ')} deleted from business ${idBusiness}.`,
    );
  }

  /**
   * Sets (replaces) all tags for a business with a new array of tags.
   * This is similar to your original 'addTagToBusiness' but with a clearer name.
   * @param idBusiness The ID of the business.
   * @param tags An array of tags to set.
   */
  async setTagsForBusiness(idBusiness: string, tags: string[]): Promise<void> {
    await this.searchBusines.checkOne(idBusiness);
    await this.prisma.searchableBusiness.update({
      where: { id: idBusiness },
      data: { tagNames: tags },
    });
    console.log(`Tags for business ${idBusiness} set to: ${tags.join(', ')}.`);
  }
}
