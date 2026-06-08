import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'lead.architect@erp.com', description: 'Unique email address' })
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Minimum 8 characters password' })
  password!: string;

  @ApiProperty({ example: 'Alexander Wright', description: 'Full user name' })
  name!: string;

  @ApiProperty({ example: 'ADMIN', default: 'USER', required: false, description: 'User role context' })
  role?: string;
}