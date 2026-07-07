import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.const';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { PermissionsService } from './permissions.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PERMISSIONS_READ)
  @ApiOperation({ summary: 'Lista as permissões disponíveis no sistema' })
  @ApiResponse({ status: 200, description: 'Lista paginada de permissões.' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.permissionsService.findAll(query);
  }
}
