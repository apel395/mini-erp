import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({ example: 'PAID', enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] })
  status!: string;
}