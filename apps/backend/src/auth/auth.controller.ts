import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@ApiTags('Auth Subsystem')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new administrative or operating user profile' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({ status: 400, description: 'Validation fails or email already registered.' })
  async register(@Body() body: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw new BadRequestException('Email account already registered');
    }
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        role: body.role || 'USER'
      }
    });
    return { id: user.id, name: user.name, email: user.email };
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate session parameters to return high security JWT authorization tokens' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated. Access token returned.' })
  @ApiResponse({ status: 401, description: 'Invalid user credentials.' })
  async login(@Body() body: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credential records');
    }
    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credential records');
    }
    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }, { secret: 'SECRET_JWT_PASSPHRASE_KEY' });

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  }
}