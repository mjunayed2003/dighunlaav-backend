import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class DrawService {
  constructor(private prisma: PrismaService) {}

  async runDraw() {
    const activeCustomers = await this.prisma.customer.findMany({
      where: { status: 'ACTIVE' }
    });

    if (activeCustomers.length < 3) {
      throw new BadRequestException('Insufficient active customers. At least 3 active customers required.');
    }

    // Shuffle
    const shuffled = [...activeCustomers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, 3);
    
    // Fetch prizes from settings or use defaults
    const prizeConfigSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'PRIZE_CONFIG' }
    });
    
    let prizes = {
      first: { title: "Smart 4K UHD LED TV (55\")" },
      second: { title: "Microwave Oven & Air Fryer Combo" },
      third: { title: "Wireless ANC Soundbar & Subwoofer" }
    };

    if (prizeConfigSetting) {
      prizes = JSON.parse(prizeConfigSetting.value);
    }

    return [
      { position: 1, customer: selected[0], prize: prizes.first.title },
      { position: 2, customer: selected[1], prize: prizes.second.title },
      { position: 3, customer: selected[2], prize: prizes.third.title },
    ];
  }

  async saveDrawResult(title: string, winners: { position: number, customerId: string, prizeDetails: string }[]) {
    // Transaction to create Draw, Winners, and update Customer status
    return this.prisma.$transaction(async (tx) => {
      const newDraw = await tx.draw.create({
        data: {
          title,
          drawDate: new Date(),
          winners: {
            create: winners.map(w => ({
              position: w.position,
              prizeDetails: w.prizeDetails,
              customerId: w.customerId
            }))
          }
        },
        include: { winners: true }
      });

      // Update customers to won
      await tx.customer.updateMany({
        where: { id: { in: winners.map(w => w.customerId) } },
        data: { status: 'WON' }
      });

      // Update next draw date (+14 days)
      const nextDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      await tx.systemSetting.upsert({
        where: { key: 'NEXT_DRAW_DATE' },
        update: { value: JSON.stringify(nextDate) },
        create: { key: 'NEXT_DRAW_DATE', value: JSON.stringify(nextDate) }
      });

      return newDraw;
    });
  }

  async getDrawHistory() {
    return this.prisma.draw.findMany({
      orderBy: { drawDate: 'desc' },
      include: {
        winners: {
          include: { customer: true }
        }
      }
    });
  }
}
