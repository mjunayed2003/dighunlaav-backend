import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async createCustomer(data: { name: string; phone: string; address: string; product: string }, status: string = 'ACTIVE') {
    // Generate code
    const num = Math.floor(1000 + Math.random() * 9000);
    const initials = data.name
      ? data.name.split(" ").filter(Boolean).map((p) => p[0].toUpperCase()).slice(0, 2).join("")
      : "TK";
    const alpha = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const code = `RAFFLE-${num}-${initials || alpha}`;

    return this.prisma.customer.create({
      data: {
        ...data,
        code,
        status,
      },
    });
  }

  async acceptCustomer(id: string, sendSms: boolean) {
    const customer = await this.prisma.customer.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    
    // In a real app, integrate SMS provider here if sendSms is true
    // For now we just return the accepted customer
    return customer;
  }

  async getActiveCustomers() {
    return this.prisma.customer.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllCustomers() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteCustomer(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
