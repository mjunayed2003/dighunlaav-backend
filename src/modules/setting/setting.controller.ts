import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingService } from './setting.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('next-draw')
  async getNextDraw() {
    return this.settingService.getNextDrawDate();
  }

  @Post('next-draw')
  @UseGuards(JwtAuthGuard)
  async setNextDraw(@Body() body: { date: string }) {
    return this.settingService.setNextDrawDate(body.date);
  }

  @Get('prizes')
  async getPrizes() {
    return this.settingService.getPrizes();
  }

  @Post('prizes')
  @UseGuards(JwtAuthGuard)
  async setPrizes(@Body() body: any) {
    return this.settingService.setPrizes(body);
  }
}
