import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.const';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@ApiTags('Specialties')
@ApiBearerAuth()
@Controller('specialties')
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SPECIALTIES_READ)
  @ApiOperation({ summary: 'Lista especialidades paginadas' })
  @ApiResponse({ status: 200, description: 'Lista paginada de especialidades.' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.specialtiesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SPECIALTIES_READ)
  @ApiOperation({ summary: 'Detalha uma especialidade' })
  @ApiResponse({ status: 200, description: 'Especialidade encontrada.' })
  @ApiResponse({ status: 404, description: 'Especialidade não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.specialtiesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SPECIALTIES_CREATE)
  @ApiOperation({ summary: 'Cria uma especialidade' })
  @ApiResponse({ status: 201, description: 'Especialidade criada.' })
  @ApiResponse({ status: 409, description: 'Nome ou código já cadastrado.' })
  create(@Body() dto: CreateSpecialtyDto) {
    return this.specialtiesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SPECIALTIES_UPDATE)
  @ApiOperation({ summary: 'Atualiza uma especialidade' })
  @ApiResponse({ status: 200, description: 'Especialidade atualizada.' })
  update(@Param('id') id: string, @Body() dto: UpdateSpecialtyDto) {
    return this.specialtiesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.SPECIALTIES_DELETE)
  @ApiOperation({ summary: 'Remove (soft delete) uma especialidade' })
  @ApiResponse({ status: 200, description: 'Especialidade removida.' })
  remove(@Param('id') id: string) {
    return this.specialtiesService.remove(id);
  }
}
