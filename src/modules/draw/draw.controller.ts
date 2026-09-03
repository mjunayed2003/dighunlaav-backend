import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DrawService } from './draw.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('draw')
@UseGuards(JwtAuthGuard)
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
