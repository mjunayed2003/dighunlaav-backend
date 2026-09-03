import { Module } from '@nestjs/common';
import { DrawController } from './draw.controller.js';
import { DrawService } from './draw.service.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';

import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DrawController],
  providers: [DrawService]
})
export class DrawModule {}
