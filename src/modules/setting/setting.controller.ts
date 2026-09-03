import { Controller, Get, Post, Body } from '@nestjs/common';
import { SettingService } from './setting.service.js';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('next-draw')
  async getNextDraw() {
    return this.settingService.getNextDrawDate();
  }

  @Post('next-draw')
  async setNextDraw(@Body() body: { date: string }) {
    return this.settingService.setNextDrawDate(body.date);
  }

  @Get('prizes')
  async getPrizes() {
    return this.settingService.getPrizes();
  }

  @Post('prizes')
  async setPrizes(@Body() body: any) {
    return this.settingService.setPrizes(body);
  }
}
