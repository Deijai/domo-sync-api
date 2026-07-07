import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.const';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { HealthUnitsService } from './health-units.service';
import { CreateHealthUnitDto } from './dto/create-health-unit.dto';
import { UpdateHealthUnitDto } from './dto/update-health-unit.dto';

@ApiTags('Health Units')
@ApiBearerAuth()
@Controller('health-units')
export class HealthUnitsController {
  constructor(private readonly healthUnitsService: HealthUnitsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.HEALTH_UNITS_READ)
  @ApiOperation({ summary: 'Lista unidades de saúde paginadas' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de unidades de saúde.',
  })
  findAll(@Query() query: PaginationQueryDto) {
    return this.healthUnitsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.HEALTH_UNITS_READ)
  @ApiOperation({ summary: 'Detalha uma unidade de saúde' })
  @ApiResponse({ status: 200, description: 'Unidade encontrada.' })
  @ApiResponse({ status: 404, description: 'Unidade não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.healthUnitsService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.HEALTH_UNITS_CREATE)
  @ApiOperation({ summary: 'Cria uma unidade de saúde' })
  @ApiResponse({ status: 201, description: 'Unidade criada.' })
  @ApiResponse({ status: 409, description: 'Código já cadastrado.' })
  create(@Body() dto: CreateHealthUnitDto) {
    return this.healthUnitsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.HEALTH_UNITS_UPDATE)
  @ApiOperation({ summary: 'Atualiza uma unidade de saúde' })
  @ApiResponse({ status: 200, description: 'Unidade atualizada.' })
  update(@Param('id') id: string, @Body() dto: UpdateHealthUnitDto) {
    return this.healthUnitsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.HEALTH_UNITS_DELETE)
  @ApiOperation({ summary: 'Remove (soft delete) uma unidade de saúde' })
  @ApiResponse({ status: 200, description: 'Unidade removida.' })
  remove(@Param('id') id: string) {
    return this.healthUnitsService.remove(id);
  }
}
