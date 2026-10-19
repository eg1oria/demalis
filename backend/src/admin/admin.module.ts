import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminPlacesService } from './places.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminPlacesService],
})
export class AdminModule {}
