import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.const';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { SetProfessionalSpecialtiesDto } from './dto/set-professional-specialties.dto';

@ApiTags('Professionals')
@ApiBearerAuth()
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PROFESSIONALS_READ)
  @ApiOperation({ summary: 'Lista profissionais paginados' })
  @ApiResponse({ status: 200, description: 'Lista paginada de profissionais.' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.professionalsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PROFESSIONALS_READ)
  @ApiOperation({ summary: 'Detalha um profissional' })
  @ApiResponse({ status: 200, description: 'Profissional encontrado.' })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.professionalsService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PROFESSIONALS_CREATE)
  @ApiOperation({ summary: 'Cria um profissional' })
  @ApiResponse({ status: 201, description: 'Profissional criado.' })
  @ApiResponse({ status: 409, description: 'CPF já cadastrado.' })
  create(@Body() dto: CreateProfessionalDto) {
    return this.professionalsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PROFESSIONALS_UPDATE)
  @ApiOperation({ summary: 'Atualiza um profissional' })
  @ApiResponse({ status: 200, description: 'Profissional atualizado.' })
  update(@Param('id') id: string, @Body() dto: UpdateProfessionalDto) {
    return this.professionalsService.update(id, dto);
  }

  @Patch(':id/specialties')
  @RequirePermissions(PERMISSIONS.PROFESSIONALS_UPDATE)
  @ApiOperation({ summary: 'Define o conjunto exato de especialidades do profissional' })
  @ApiResponse({ status: 200, description: 'Especialidades atualizadas.' })
  setSpecialties(@Param('id') id: string, @Body() dto: SetProfessionalSpecialtiesDto) {
    return this.professionalsService.setSpecialties(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PROFESSIONALS_DELETE)
  @ApiOperation({ summary: 'Remove (soft delete) um profissional' })
  @ApiResponse({ status: 200, description: 'Profissional removido.' })
  remove(@Param('id') id: string) {
    return this.professionalsService.remove(id);
  }
}
