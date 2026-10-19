import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  controllers: [PublicController],
  providers: [PublicService, FormsService],
})
export class PublicModule {}
