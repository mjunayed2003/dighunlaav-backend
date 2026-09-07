import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    // Connection established
  }

  handleDisconnect(client: Socket) {
    // Connection closed
  }

  /**
   * Customer joins their individual chat room
   */
  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { customerId: string },
  ) {
    if (!data?.customerId) return;
    const room = `customer_${data.customerId}`;
    client.join(room);

    try {
      const customer = await this.chatService.getCustomerById(data.customerId);
      const messages = await this.chatService.getCustomerMessages(data.customerId);

      client.emit('chat_init', {
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          isBlocked: customer.isBlocked,
        },
        messages,
      });
    } catch (err: any) {
      client.emit('chat_error', { message: err.message || 'Failed to load chat' });
    }
  }

  /**
   * Admin / Super Admin joins the admin monitoring room
   */
  @SubscribeMessage('admin_join')
  async handleAdminJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { adminRole?: string },
  ) {
    client.join('admin_lobby');

    try {
      const conversations = await this.chatService.getAllConversations();
      client.emit('conversations_list', conversations);
    } catch (err: any) {
      client.emit('chat_error', { message: err.message || 'Failed to load conversations' });
    }
  }

  /**
   * Admin joins a specific customer's room to chat directly
   */
  @SubscribeMessage('admin_join_customer_room')
  async handleAdminJoinCustomerRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { customerId: string },
  ) {
    if (!data?.customerId) return;
    const room = `customer_${data.customerId}`;
    client.join(room);

    try {
      const messages = await this.chatService.getCustomerMessages(data.customerId);
      const customer = await this.chatService.getCustomerById(data.customerId);

      client.emit('room_messages', {
        customerId: data.customerId,
        customer,
        messages,
      });
    } catch (err: any) {
      client.emit('chat_error', { message: err.message || 'Failed to load customer messages' });
    }
  }

  /**
   * Sending a message (Customer, Admin, or Super Admin)
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      customerId: string;
      senderRole: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
      senderName: string;
      text: string;
    },
  ) {
    if (!data?.customerId || !data?.text?.trim()) {
      return;
    }

    try {
      const savedMessage = await this.chatService.saveMessage(
        data.customerId,
        data.senderRole,
        data.senderName,
        data.text,
      );

      const room = `customer_${data.customerId}`;

      // Emit to customer room
      this.server.to(room).emit('new_message', savedMessage);

      // Emit to admin lobby so conversation list updates in real-time
      this.server.to('admin_lobby').emit('conversation_updated', {
        customerId: data.customerId,
        lastMessage: savedMessage.text,
        lastSenderRole: savedMessage.senderRole,
        lastMessageTime: savedMessage.createdAt,
      });
    } catch (err: any) {
      client.emit('error_blocked', {
        message: err.message || 'You cannot send messages at this time.',
      });
    }
  }

  /**
   * Admin / Super Admin blocks or unblocks a customer
   */
  @SubscribeMessage('block_customer')
  async handleBlockCustomer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { customerId: string; isBlocked: boolean; adminName?: string },
  ) {
    if (!data?.customerId) return;

    try {
      const updatedCustomer = await this.chatService.toggleBlockCustomer(
        data.customerId,
        data.isBlocked,
      );

      const room = `customer_${data.customerId}`;

      // Notify the customer in real-time
      this.server.to(room).emit('customer_blocked_status', {
        customerId: updatedCustomer.id,
        isBlocked: updatedCustomer.isBlocked,
      });

      // Notify all admins
      this.server.to('admin_lobby').emit('customer_status_updated', {
        customerId: updatedCustomer.id,
        isBlocked: updatedCustomer.isBlocked,
      });
    } catch (err: any) {
      client.emit('chat_error', { message: err.message || 'Failed to update block status' });
    }
  }

  /**
   * Typing indicators
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      customerId: string;
      senderRole: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
      senderName: string;
      isTyping: boolean;
    },
  ) {
    if (!data?.customerId) return;
    const room = `customer_${data.customerId}`;
    client.to(room).emit('typing_status', data);
  }
}
