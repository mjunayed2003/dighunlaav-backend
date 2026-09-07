import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async onModuleInit() {
    try {
      // Auto-migrate schema changes seamlessly
      await this.prisma.$executeRawUnsafe(`ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "phone" TEXT;`);
      await this.prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Admin_phone_key" ON "Admin"("phone");`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "resetOtp" TEXT;`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "resetOtpExpires" TIMESTAMP(3);`);
      await this.prisma.$executeRawUnsafe(`UPDATE "Admin" SET phone = '01700000000' WHERE email = 'admin@example.com' AND (phone IS NULL OR phone = '');`);
    } catch (err: any) {
      console.warn('Admin table migration info:', err?.message);
    }
  }

  async login(identifier: string, pass: string) {
    if (!identifier || !pass) {
      throw new BadRequestException('Identifier and password are required');
    }

    const cleanIdentifier = identifier.trim();

    // Look up by email OR phone number
    const admin = await this.prisma.admin.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { phone: cleanIdentifier }
        ]
      }
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    const isMatch = await bcrypt.compare(pass, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    const payload = { 
      email: admin.email, 
      phone: admin.phone, 
      role: admin.role, 
      sub: admin.id 
    };

    return {
      access_token: this.jwtService.sign(payload),
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
    };
  }

  async forgotPassword(identifier: string) {
    if (!identifier) {
      throw new BadRequestException('Please provide your email or phone number');
    }

    const cleanIdentifier = identifier.trim();

    const admin = await this.prisma.admin.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { phone: cleanIdentifier }
        ]
      }
    });

    if (!admin) {
      throw new NotFoundException('No account found with this email or phone number');
    }

    // Generate 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: {
        resetOtp: otp,
        resetOtpExpires: expires,
      }
    });

    return {
      success: true,
      message: 'Verification code generated successfully',
      otp, // Provided for direct demonstration / SMS / Email simulation
      account: {
        email: admin.email,
        phone: admin.phone
      }
    };
  }

  async resetPassword(identifier: string, otp: string, newPass: string) {
    if (!identifier || !otp || !newPass) {
      throw new BadRequestException('All fields (email/phone, verification code, new password) are required');
    }

    if (newPass.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    const cleanIdentifier = identifier.trim();
    const cleanOtp = otp.trim();

    const admin = await this.prisma.admin.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { phone: cleanIdentifier }
        ]
      }
    });

    if (!admin) {
      throw new NotFoundException('Account not found');
    }

    if (!admin.resetOtp || admin.resetOtp !== cleanOtp) {
      throw new BadRequestException('Invalid verification code');
    }

    if (!admin.resetOtpExpires || new Date() > admin.resetOtpExpires) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpires: null,
      }
    });

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    };
  }
}

