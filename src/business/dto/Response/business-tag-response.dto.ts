import { Tag } from '@prisma/client';

export class BusinessTagResponseDto {
  id: string;
  name: string;

  static fromPrismaTag(tag: Tag): BusinessTagResponseDto {
    const dto = new BusinessTagResponseDto();
    dto.id = tag.id;
    dto.name = tag.name;
    return dto;
  }

  static fromPrismaTags(tags: Tag[]): BusinessTagResponseDto[] {
    return tags.map((t) => BusinessTagResponseDto.fromPrismaTag(t));
  }
}
