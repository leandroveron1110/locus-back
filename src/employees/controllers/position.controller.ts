import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PositionService } from '../services/position.service';


@Controller('positions')
export class PositionController {
  constructor(
    private readonly positionService: PositionService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      businessId: string;
      name: string;
    },
  ) {
    return this.positionService.create(body);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.positionService.findById(id);
  }

  @Get('business/:businessId')
  findByBusinessId(
    @Param('businessId') businessId: string,
  ) {
    return this.positionService.findByBusinessId(
      businessId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
    },
  ) {
    return this.positionService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.positionService.delete(id);
  }
}