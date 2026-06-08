import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'lead.architect@erp.com' })
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  password!: string;
}