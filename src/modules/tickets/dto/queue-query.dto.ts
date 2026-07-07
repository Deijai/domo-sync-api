import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class QueueQueryDto {
  @ApiProperty({ description: 'Unidade de saúde da fila' })
  @IsUUID()
  @IsNotEmpty()
  healthUnitId!: string;
}
