import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class SetProfessionalSpecialtiesDto {
  @ApiProperty({ type: [String], description: 'IDs das especialidades atendidas pelo profissional' })
  @IsArray()
  @IsUUID('4', { each: true })
  specialtyIds!: string[];
}
