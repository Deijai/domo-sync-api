import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.const';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PublicRegisterPatientDto } from './dto/public-register-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('public-register')
  @ApiOperation({ summary: 'Cadastro público de paciente (usado pelo app mobile)' })
  @ApiResponse({ status: 201, description: 'Paciente cadastrado.' })
  @ApiResponse({ status: 409, description: 'CPF, cartão SUS ou e-mail já cadastrado.' })
  publicRegister(@Body() dto: PublicRegisterPatientDto) {
    return this.patientsService.publicRegister(dto);
  }

  @ApiBearerAuth()
  @Get('me/profile')
  @ApiOperation({ summary: 'Retorna o perfil do paciente autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil do paciente.' })
  getMyProfile(@CurrentUser() principal: JwtPayload) {
    return this.patientsService.getMyProfile(principal);
  }

  @ApiBearerAuth()
  @Patch('me/profile')
  @ApiOperation({ summary: 'Atualiza o perfil do paciente autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  updateMyProfile(@CurrentUser() principal: JwtPayload, @Body() dto: UpdatePatientProfileDto) {
    return this.patientsService.updateMyProfile(principal, dto);
  }

  @ApiBearerAuth()
  @Get()
  @RequirePermissions(PERMISSIONS.PATIENTS_READ)
  @ApiOperation({ summary: 'Lista pacientes paginados (admin)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de pacientes.' })
  findAll(@Query() query: QueryPatientsDto) {
    return this.patientsService.findAll(query);
  }

  @ApiBearerAuth()
  @Get(':id')
  @RequirePermissions(PERMISSIONS.PATIENTS_READ)
  @ApiOperation({ summary: 'Detalha um paciente (admin)' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado.' })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @ApiBearerAuth()
  @Post()
  @RequirePermissions(PERMISSIONS.PATIENTS_CREATE)
  @ApiOperation({ summary: 'Cria um paciente (admin)' })
  @ApiResponse({ status: 201, description: 'Paciente criado.' })
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PATIENTS_UPDATE)
  @ApiOperation({ summary: 'Atualiza um paciente (admin)' })
  @ApiResponse({ status: 200, description: 'Paciente atualizado.' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PATIENTS_DELETE)
  @ApiOperation({ summary: 'Remove (soft delete) um paciente (admin)' })
  @ApiResponse({ status: 200, description: 'Paciente removido.' })
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
