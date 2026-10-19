import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminPlacesService } from './places.service';
import { AdminUnitsService } from './units.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminPlacesService, AdminUnitsService],
})
export class AdminModule {}
