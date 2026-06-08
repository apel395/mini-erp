import { Controller, Get, Post, Body, Delete, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiTags('Customers CRM Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/customers')
export class CustomersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve comprehensive alphabetical directory index of B2B organization catalogs' })
  @ApiResponse({ status: 200, description: 'Array of customer objects returned.' })
  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { name: 'asc' }
    });
  }

  @Post()
  @ApiOperation({ summary: 'Onboard a new organization profile directly into the ERP directory' })
  @ApiResponse({ status: 201, description: 'Customer record securely initialized and saved.' })
  @ApiResponse({ status: 400, description: 'Invalid schema attributes.' })
  async create(@Body() body: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address
      }
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Purge a customer registry entry from the database' })
  @ApiResponse({ status: 200, description: 'Customer profile successfully removed.' })
  @ApiResponse({ status: 400, description: 'Database Restriction: Active invoice dependency restricts drops.' })
  async remove(@Param('id') id: string) {
    const invoices = await this.prisma.invoice.findFirst({ where: { customerId: id } });
    if (invoices) {
      throw new BadRequestException('Database Restriction: Cannot delete a customer containing active invoices');
    }
    return this.prisma.customer.delete({ where: { id } });
  }
}