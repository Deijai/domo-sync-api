import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CallNextTicketDto {
  @ApiProperty({ description: 'Unidade de saúde cuja fila será chamada' })
  @IsUUID()
  @IsNotEmpty()
  healthUnitId!: string;

  @ApiProperty({ example: '0001', description: 'Identificação do guichê/sala que está chamando a ficha' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  counterLabel!: string;
}
