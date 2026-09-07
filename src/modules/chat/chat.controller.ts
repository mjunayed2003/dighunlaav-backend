import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Customer enters name and phone to join chat
   */
  @Post('customer-auth')
  async customerAuth(@Body() body: { name: string; phone: string }) {
    return this.chatService.findOrCreateCustomer(body.name, body.phone);
  }

  /**
   * Get single customer info
   */
  @Get('customer/:id')
  async getCustomer(@Param('id') id: string) {
    return this.chatService.getCustomerById(id);
  }

  /**
   * Get all active conversations for admin
   */
  @Get('conversations')
  async getConversations() {
    return this.chatService.getAllConversations();
  }

  /**
   * Get messages for a customer
   */
  @Get('history/:customerId')
  async getHistory(@Param('customerId') customerId: string) {
    return this.chatService.getCustomerMessages(customerId);
  }

  /**
   * Admin blocks or unblocks a customer
   */
  @Post('block/:customerId')
  async toggleBlock(
    @Param('customerId') customerId: string,
    @Body() body: { isBlocked: boolean },
  ) {
    return this.chatService.toggleBlockCustomer(customerId, body.isBlocked);
  }
}
