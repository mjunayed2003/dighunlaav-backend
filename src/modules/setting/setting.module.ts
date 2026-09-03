import { Module } from '@nestjs/common';
import { SettingController } from './setting.controller.js';
import { SettingService } from './setting.service.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';

import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SettingController],
  providers: [SettingService]
})
export class SettingModule {}
