import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class PatientLoginDto {
  @ApiProperty({ example: '00000000000', description: 'CPF ou e-mail do paciente' })
  @IsString()
  login!: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6)
  password!: string;
}
