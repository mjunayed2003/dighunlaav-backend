import { Controller, Get, Post, Body, Delete, Param, UseGuards, Req, Put, UnauthorizedException } from '@nestjs/common';
import { CustomerService } from './customer.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() body: { name: string; phone: string; address: string; product: string }) {
    const role = req.user?.role;
    const status = role === 'ADMIN' ? 'PENDING' : 'ACTIVE';
    return this.customerService.createCustomer(body, status);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/accept')
  async acceptCustomer(@Param('id') id: string, @Req() req: any, @Body() body: { sendSms: boolean }) {
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only Super Admin can accept customers');
    }
    return this.customerService.acceptCustomer(id, body.sendSms);
  }

  @Get('active')
  async getActive() {
    return this.customerService.getActiveCustomers();
  }

  @Get()
  async getAll() {
    return this.customerService.getAllCustomers();
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only Super Admin can delete customers');
    }
    return this.customerService.deleteCustomer(id);
  }
}
