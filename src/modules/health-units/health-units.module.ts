import { Module } from '@nestjs/common';
import { HealthUnitsController } from './health-units.controller';
import { HealthUnitsService } from './health-units.service';

@Module({
  controllers: [HealthUnitsController],
  providers: [HealthUnitsService],
  exports: [HealthUnitsService],
})
export class HealthUnitsModule {}
