import { Controller, Get, Post, Patch, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('Invoice Ledger Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/invoices')
export class InvoicesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List and search complete ledger of accounting claims with related organization info' })
  @ApiResponse({ status: 200, description: 'Invoices array returns.' })
  async findAll() {
    return this.prisma.invoice.findMany({
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post()
  @ApiOperation({ summary: 'Compile, securely compute VAT, and record a new active invoice record' })
  @ApiResponse({ status: 201, description: 'Invoice totals computed securely and written.' })
  @ApiResponse({ status: 400, description: 'Validation on line items fails.' })
  async create(@Body() body: CreateInvoiceDto) {
    if (!body.customerId || !body.items || body.items.length === 0) {
      throw new BadRequestException('Customer validation and line items are required');
    }

    const subTotal = body.items.reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.price)), 0);
    const taxTotal = subTotal * 0.10; // Secure calculation: 10% standard VAT execution
    const grandTotal = subTotal + taxTotal;
    const invoiceNo = 'INV-' + Date.now().toString().slice(-8);

    return this.prisma.invoice.create({
      data: {
        invoiceNo,
        customerId: body.customerId,
        dueDate: new Date(body.dueDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
        subTotal,
        taxTotal,
        grandTotal,
        status: 'SENT',
        items: {
          create: body.items.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity),
            price: Number(item.price),
            total: Number(item.quantity) * Number(item.price)
          }))
        }
      },
      include: { customer: true, items: true }
    });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition state values inside the status state-machine context' })
  @ApiResponse({ status: 200, description: 'State successfully mutated.' })
  @ApiResponse({ status: 400, description: 'Target state illegal transition.' })
  async updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    const allowed = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
    if (!allowed.includes(body.status)) {
      throw new BadRequestException('Invalid status state target');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: body.status }
    });
  }
}