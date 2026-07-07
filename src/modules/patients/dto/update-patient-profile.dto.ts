import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';

export class UpdatePatientProfileDto extends PartialType(
  OmitType(CreatePatientDto, ['cpf', 'status', 'password'] as const),
) {}
