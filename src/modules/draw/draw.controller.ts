import { Controller, Get, Post, Body } from '@nestjs/common';
import { DrawService } from './draw.service.js';

@Controller('draw')
export class DrawController {
  constructor(private readonly drawService: DrawService) {}

  @Post('run')
  async runDraw() {
    return this.drawService.runDraw();
  }

  @Post('save')
  async saveDraw(@Body() body: { title: string, winners: { position: number, customerId: string, prizeDetails: string }[] }) {
    return this.drawService.saveDrawResult(body.title, body.winners);
  }

  @Get('history')
  async getHistory() {
    return this.drawService.getDrawHistory();
  }
}
