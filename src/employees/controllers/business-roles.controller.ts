import { Controller, Post, Patch, Get, Body, Param } from "@nestjs/common";
import { RolesService } from "../services/roles.service";
import {
  CreateBusinessRoleDto,
  UpdateBusinessRoleDto,
} from "../dto/request/business-role.dto";
import { Public } from "src/auth/decorators/public.decorator";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { Permissions } from "src/auth/decorators/permissions.decorator";
import { BusinessRoles } from "src/common/enums/rolees-permissions";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Public()
  createRole(@Body() dto: CreateBusinessRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Patch(":roleId")
  @Public()
  updateRole(@Param("roleId") roleId: string, @Body() dto: UpdateBusinessRoleDto) {
    return this.rolesService.updateRole(roleId, dto);
  }

  @Get("business/:businessId")
  @Roles(UserRole.OWNER)
  @Permissions(BusinessRoles.MANAGER)
  listRoles(@Param("businessId") businessId: string) {
    return this.rolesService.listRoles(businessId);
  }

  @Get(":roleId")
  @Public()
  getRole(@Param("roleId") roleId: string) {
    return this.rolesService.getRoleById(roleId);
  }
}
