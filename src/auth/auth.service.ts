import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new UnauthorizedException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role || 'patient',
      },
    });

    const token = this.signToken(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, role: user.role }, ...token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, role: user.role }, ...token };
  }

  async getMe(userId: string) {
    if (process.env.DEMO_MODE === 'true' && userId === 'demo-user-id') {
      const patient = await this.prisma.patient.findFirst({
        where: { user: { email: 'patient@demo.com' } },
      });
      const clinician = await this.prisma.clinician.findFirst({
        where: { user: { email: 'clinician@demo.com' } },
      });
      return {
        id: 'demo-user-id',
        email: 'demo@healthsphere.local',
        role: 'demo',
        patient,
        clinician,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true, clinician: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const { passwordHash, ...rest } = user;
    return rest;
  }

  private signToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
