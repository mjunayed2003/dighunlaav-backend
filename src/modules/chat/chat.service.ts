import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Identifies or registers a customer by phone and name for the chat session.
   */
  async findOrCreateCustomer(name: string, phone: string) {
    const cleanPhone = phone.trim();
    const cleanName = name.trim();

    let customer = await this.prisma.customer.findFirst({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      const num = Math.floor(1000 + Math.random() * 9000);
      const initials = cleanName
        ? cleanName.split(' ').filter(Boolean).map((p) => p[0].toUpperCase()).slice(0, 2).join('')
        : 'TK';
      const alpha = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const code = `CHAT-${num}-${initials || alpha}`;

      customer = await this.prisma.customer.create({
        data: {
          name: cleanName || 'Guest Customer',
          phone: cleanPhone,
          address: 'Online Support',
          product: 'General Support Inquiry',
          code,
          status: 'ACTIVE',
          isBlocked: false,
        },
      });
    }

    return customer;
  }

  /**
   * Get single customer by ID
   */
  async getCustomerById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  /**
   * Toggle block status for a customer
   */
  async toggleBlockCustomer(customerId: string, isBlocked: boolean) {
    const customer = await this.prisma.customer.update({
      where: { id: customerId },
      data: { isBlocked },
    });
    return customer;
  }

  /**
   * Save a chat message
   */
  async saveMessage(
    customerId: string,
    senderRole: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN',
    senderName: string,
    text: string,
  ) {
    // Check if customer is blocked
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.isBlocked && senderRole === 'CUSTOMER') {
      throw new ForbiddenException('You have been blocked by the admin.');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        customerId,
        senderRole,
        senderName: senderName || (senderRole === 'CUSTOMER' ? customer.name : 'Support Admin'),
        text: text.trim(),
      },
    });

    return {
      ...message,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        isBlocked: customer.isBlocked,
      },
    };
  }

  /**
   * Get message history for a specific customer
   */
  async getCustomerMessages(customerId: string) {
    return this.prisma.chatMessage.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get all active conversations for admin/super-admin
   */
  async getAllConversations() {
    // Get all customers who have at least one message or are active
    const customers = await this.prisma.customer.findMany({
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      code: c.code,
      status: c.status,
      isBlocked: c.isBlocked,
      createdAt: c.createdAt,
      lastMessage: c.messages[0] ? c.messages[0].text : null,
      lastMessageTime: c.messages[0] ? c.messages[0].createdAt : c.updatedAt,
      lastSenderRole: c.messages[0] ? c.messages[0].senderRole : null,
    }));
  }
}
