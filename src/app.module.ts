import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { CustomerModule } from './modules/customer/customer.module.js';
import { DrawModule } from './modules/draw/draw.module.js';
import { SettingModule } from './modules/setting/setting.module.js';
import { AuthModule } from './modules/auth/auth.module.js';

@Module({
  imports: [PrismaModule, CustomerModule, DrawModule, SettingModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
