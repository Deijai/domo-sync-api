import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CallTicketDto {
  @ApiProperty({ example: '0001', description: 'Identificação do guichê/sala que está chamando a ficha' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  counterLabel!: string;
}
