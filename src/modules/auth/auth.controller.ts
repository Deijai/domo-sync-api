import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PatientLoginDto } from './dto/patient-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { JwtPayload } from './types/jwt-payload.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login de usuário interno (admin/operador/profissional)' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('patient-login')
  @ApiOperation({ summary: 'Login de paciente (CPF ou e-mail)' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  patientLogin(@Body() dto: PatientLoginDto) {
    return this.authService.patientLogin(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Renova o access token a partir de um refresh token válido' })
  @ApiResponse({ status: 200, description: 'Tokens renovados com sucesso.' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado.' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Revoga o refresh token informado' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso.' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Retorna os dados do usuário ou paciente autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do principal autenticado.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  me(@CurrentUser() principal: JwtPayload) {
    return this.authService.me(principal);
  }
}
