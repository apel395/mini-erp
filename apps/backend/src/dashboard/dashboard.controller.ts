import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@ApiTags('Dashboard Aggregates Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Collect dynamic, high-fidelity business telemetry from across complete systems databases' })
  @ApiResponse({ status: 200, description: 'Aggregated analytics parameters object returned.' })
  async getSummary() {
    const invoices = await this.prisma.invoice.findMany();
    const customersCount = await this.prisma.customer.count();

    const totalRevenue = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + i.grandTotal, 0);

    const outstanding = invoices
      .filter(i => i.status === 'SENT' || i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.grandTotal, 0);

    const paidInvoicesCount = invoices.filter(i => i.status === 'PAID').length;
    const sentInvoicesCount = invoices.filter(i => i.status === 'SENT').length;
    const overdueInvoicesCount = invoices.filter(i => i.status === 'OVERDUE').length;

    return {
      totalRevenue,
      outstanding,
      customersCount,
      paidInvoicesCount,
      sentInvoicesCount,
      overdueInvoicesCount,
      totalInvoicesCount: invoices.length
    };
  }
}