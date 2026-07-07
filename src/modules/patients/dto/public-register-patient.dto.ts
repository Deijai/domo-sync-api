import { OmitType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';

export class PublicRegisterPatientDto extends OmitType(CreatePatientDto, ['status'] as const) {}
