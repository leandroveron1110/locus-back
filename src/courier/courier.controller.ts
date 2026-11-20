// courier.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CourierCommandService } from "./courier-command.service";
import { CourierQueryService } from "./courier-query.service";
import { ChangeCourierPasswordDto } from "./dto/change-courier-password.dto";
import { CreateCourierDto } from "./dto/create-courier.dto";
import { LoginCourierDto } from "./dto/login-courier.dto";
import { SetWorkingStateDto } from "./dto/set-working-state.dto";
import { UpdateCourierDto } from "./dto/update-courier.dto";
import { Public } from "src/auth/decorators/public.decorator";

@Controller("couriers")
export class CourierController {
  constructor(
    private readonly courierCommand: CourierCommandService,
    private readonly courierQuery: CourierQueryService,
  ) {}

  @Post()
  @Public()
  create(@Body() dto: CreateCourierDto) {
    return this.courierCommand.create(dto);
  }

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginCourierDto) {
    return this.courierCommand.login(dto.dni, dto.password);
  }

  @Get()
  @Public()
  findAll() {
    return this.courierQuery.findAll();
  }

  @Get("working")
  @Public()
  findWorkingCouriers() {
    return this.courierQuery.findWorkingCouriers();
  }

  @Get(":id")
  @Public()
  findById(@Param("id") id: string) {
    return this.courierQuery.findById(id);
  }

  @Patch(":id")
  @Public()
  update(@Param("id") id: string, @Body() dto: UpdateCourierDto) {
    return this.courierCommand.update(id, dto);
  }

  @Patch(":id/working-state")
  @Public()
  setWorkingState(@Param("id") id: string, @Body() dto: SetWorkingStateDto) {
    return this.courierCommand.setWorkingState(id, dto.isAvailable);
  }

  @Patch(":id/password")
  @Public()
  changePassword(
    @Param("id") id: string,
    @Body() dto: ChangeCourierPasswordDto,
  ) {
    return this.courierCommand.changePassword(id, dto);
  }
}