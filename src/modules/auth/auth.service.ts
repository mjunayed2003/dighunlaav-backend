import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(email: string, pass: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email }
    });
    
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: admin.email, sub: admin.id };
    return {
      access_token: this.jwtService.sign(payload),
      email: admin.email,
    };
  }
}
