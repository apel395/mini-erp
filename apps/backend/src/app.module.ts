import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth/auth.controller';
import { CustomersController } from './customers/customers.controller';
import { InvoicesController } from './invoices/invoices.controller';
import { DashboardController } from './dashboard/dashboard.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: 'SECRET_JWT_PASSPHRASE_KEY',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController, CustomersController, InvoicesController, DashboardController],
  providers: [PrismaService],
})
export class AppModule {}