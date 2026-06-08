import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Stark Industries' })
  name!: string;

  @ApiProperty({ example: 'accounting@stark.id' })
  email!: string;

  @ApiPropertyOptional({ example: '+1 (555) 011-8899' })
  phone?: string;

  @ApiPropertyOptional({ example: '10880 Malibu Point, CA' })
  address?: string;
}