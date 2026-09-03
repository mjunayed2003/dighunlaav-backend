import { Module } from '@nestjs/common';
import { SettingController } from './setting.controller.js';
import { SettingService } from './setting.service.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [SettingController],
  providers: [SettingService]
})
export class SettingModule {}
