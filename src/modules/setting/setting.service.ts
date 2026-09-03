import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class SettingService {
  constructor(private prisma: PrismaService) {}

  async getNextDrawDate() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'NEXT_DRAW_DATE' }
    });
    if (!setting) {
      // Default to 7 days from now if not set
      const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      return { date: defaultDate };
    }
    return { date: JSON.parse(setting.value) };
  }

  async setNextDrawDate(date: string) {
    const setting = await this.prisma.systemSetting.upsert({
      where: { key: 'NEXT_DRAW_DATE' },
      update: { value: JSON.stringify(date) },
      create: { key: 'NEXT_DRAW_DATE', value: JSON.stringify(date) }
    });
    return { date: JSON.parse(setting.value) };
  }

  async getPrizes() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'PRIZE_CONFIG' }
    });
    if (!setting) {
      const defaultPrizes = {
        first: { title: "Smart 4K UHD LED TV (55\")", highlight: "Grand Champion Prize", warranty: "Official Brand Warranty Included" },
        second: { title: "Microwave Oven & Air Fryer Combo", highlight: "1st Runner-Up Mega Prize", warranty: "Official Brand Warranty Included" },
        third: { title: "Wireless ANC Soundbar & Subwoofer", highlight: "2nd Runner-Up Premium Audio", warranty: "Official Brand Warranty Included" },
      };
      return defaultPrizes;
    }
    return JSON.parse(setting.value);
  }

  async setPrizes(prizes: any) {
    const setting = await this.prisma.systemSetting.upsert({
      where: { key: 'PRIZE_CONFIG' },
      update: { value: JSON.stringify(prizes) },
      create: { key: 'PRIZE_CONFIG', value: JSON.stringify(prizes) }
    });
    return JSON.parse(setting.value);
  }
}
