import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class InvoiceItemDto {
  @ApiProperty({ example: 'Repulsor API Integration' })
  description!: string;

  @ApiProperty({ example: 1, type: 'integer' })
  quantity!: number;

  @ApiProperty({ example: 8500.00, type: 'number' })
  price!: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: '58cbe7b2-6cb1-4cb7-86bd-991c6812cb01', description: 'Customer Reference UUID' })
  customerId!: string;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z' })
  dueDate?: string;

  @ApiProperty({ type: [InvoiceItemDto], description: 'Dynamic array of items' })
  items!: InvoiceItemDto[];
}