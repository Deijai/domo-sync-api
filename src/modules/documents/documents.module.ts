import { Module } from '@nestjs/common';
import { HealthUnitsModule } from '../health-units/health-units.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [HealthUnitsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
