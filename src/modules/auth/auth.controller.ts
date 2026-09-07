import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const identifier = body.identifier || body.email || body.phone;
    return this.authService.login(identifier, body.password);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    const identifier = body.identifier || body.email || body.phone;
    return this.authService.forgotPassword(identifier);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    const identifier = body.identifier || body.email || body.phone;
    return this.authService.resetPassword(identifier, body.otp, body.newPassword);
  }
}

