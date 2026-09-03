import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { CustomerService } from './customer.service.js';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async create(@Body() body: { name: string; phone: string; address: string; product: string }) {
    return this.customerService.createCustomer(body);
  }

  @Get('active')
  async getActive() {
    return this.customerService.getActiveCustomers();
  }

  @Get()
  async getAll() {
    return this.customerService.getAllCustomers();
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.customerService.deleteCustomer(id);
  }
}
