const fs = require('fs');
const path = require('path');

console.log("🚀 Initializing Swagger-Ready Monorepo Workspace Generator...");

// Helper utility to make directories recursively
const makeDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Helper utility to write files cleanly to the simulated workspace
const writeFile = (filePath, content) => {
  makeDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content.trim());
  console.log(`✨ Created file: ${filePath}`);
};

// 1. Root Package Configuration (Workspaces, scripts)
const rootPackageJson = `{
  "name": "mini-erp-invoicing",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "install:all": "npm install",
    "dev:backend": "npm run start:dev -w apps/backend",
    "dev:frontend": "npm run dev -w apps/frontend",
    "db:migrate": "npx prisma migrate dev --schema=apps/backend/prisma/schema.prisma"
  }
}`;
writeFile('package.json', rootPackageJson);

// 2. NestJS Backend package.json
const backendPackageJson = `{
  "name": "backend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "prisma": "^5.0.0",
    "typescript": "^5.1.3",
    "@types/bcrypt": "^5.0.2"
  }
}`;
writeFile('apps/backend/package.json', backendPackageJson);

// 3. NestJS tsconfig.json configuration
const tsconfigBackend = `{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}`;
writeFile('apps/backend/tsconfig.json', tsconfigBackend);

// 4. Prisma Relational Schema
const prismaSchema = `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("USER")
  createdAt DateTime @default(now())
}

model Customer {
  id        String    @id @default(uuid())
  name      String
  email     String    @unique
  phone     String?
  address   String?
  invoices  Invoice[]
  createdAt DateTime  @default(now())
}

model Invoice {
  id          String        @id @default(uuid())
  invoiceNo   String        @unique
  status      String        @default("DRAFT")
  issueDate   DateTime      @default(now())
  dueDate     DateTime
  customerId  String
  customer    Customer      @relation(fields: [customerId], references: [id], onDelete: Restrict)
  items       InvoiceItem[]
  subTotal    Float
  taxTotal    Float
  grandTotal  Float
  createdAt   DateTime      @default(now())
}

model InvoiceItem {
  id          String   @id @default(uuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  quantity    Int
  price       Float
  total       Float
}`;
writeFile('apps/backend/prisma/schema.prisma', prismaSchema);

// 5. NestJS Prisma Database Connector Service
const prismaService = `import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}`;
writeFile('apps/backend/src/prisma.service.ts', prismaService);

// 6. NestJS JWT Authentication Guard
const jwtAuthGuard = `import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: 'SECRET_JWT_PASSPHRASE_KEY' });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Session expired or invalid token signature');
    }
  }
}`;
writeFile('apps/backend/src/auth/auth.guard.ts', jwtAuthGuard);

// 7. SWAGGER DTOs (Data Transfer Objects)
const registerDto = `import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'lead.architect@erp.com', description: 'Unique email address' })
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Minimum 8 characters password' })
  password!: string;

  @ApiProperty({ example: 'Alexander Wright', description: 'Full user name' })
  name!: string;

  @ApiProperty({ example: 'ADMIN', default: 'USER', required: false, description: 'User role context' })
  role?: string;
}`;
writeFile('apps/backend/src/auth/dto/register.dto.ts', registerDto);

const loginDto = `import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'lead.architect@erp.com' })
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  password!: string;
}`;
writeFile('apps/backend/src/auth/dto/login.dto.ts', loginDto);

const createCustomerDto = `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Stark Industries' })
  name!: string;

  @ApiProperty({ example: 'accounting@stark.id' })
  email!: string;

  @ApiPropertyOptional({ example: '+1 (555) 011-8899' })
  phone?: string;

  @ApiPropertyOptional({ example: '10880 Malibu Point, CA' })
  address?: string;
}`;
writeFile('apps/backend/src/customers/dto/create-customer.dto.ts', createCustomerDto);

const createInvoiceDto = `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}`;
writeFile('apps/backend/src/invoices/dto/create-invoice.dto.ts', createInvoiceDto);

const updateStatusDto = `import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({ example: 'PAID', enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] })
  status!: string;
}`;
writeFile('apps/backend/src/invoices/dto/update-status.dto.ts', updateStatusDto);

// 8. Swagger Decorated Controllers
const authController = `import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

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
}`;
writeFile('apps/backend/src/auth/auth.controller.ts', authController);

const customersController = `import { Controller, Get, Post, Body, Delete, Param, UseGuards, BadRequestException } from '@nestjs/common';
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
}`;
writeFile('apps/backend/src/customers/customers.controller.ts', customersController);

const invoicesController = `import { Controller, Get, Post, Patch, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
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
}`;
writeFile('apps/backend/src/invoices/invoices.controller.ts', invoicesController);

const dashboardController = `import { Controller, Get, UseGuards } from '@nestjs/common';
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
}`;
writeFile('apps/backend/src/dashboard/dashboard.controller.ts', dashboardController);

// 9. NestJS AppModule
const appModule = `import { Module } from '@nestjs/common';
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
export class AppModule {}`;
writeFile('apps/backend/src/app.module.ts', appModule);

// 10. NestJS Bootstrap Main Entrance
const mainBackend = `import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Nexus ERP API Platform')
    .setDescription('Full Technical Suite of Modular ERP endpoints with active schema parameters mapping.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
  console.log('🚀 Backend running on http://localhost:3000');
  console.log('📖 Swagger endpoints hosted at http://localhost:3000/api-docs');
}
bootstrap();`;
writeFile('apps/backend/src/main.ts', mainBackend);

// 11. Next.js Frontend package.json
const frontendPackageJson = `{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.0.0",
    "typescript": "^5.0.0"
  }
}`;
writeFile('apps/frontend/package.json', frontendPackageJson);

// 12. Next.js App configuration tsconfig.json
const tsconfigFrontend = `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;
writeFile('apps/frontend/tsconfig.json', tsconfigFrontend);

// 13. Tailwind config maps
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
writeFile('apps/frontend/tailwind.config.js', tailwindConfig);

const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
writeFile('apps/frontend/postcss.config.js', postcssConfig);

// 14. Next.js Main CSS styling global import
const globalCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #020617;
  color: #f1f5f9;
}`;
writeFile('apps/frontend/src/app/globals.css', globalCss);

// 15. Next.js Layout structure Setup
const layoutTsx = `import './globals.css'

export const metadata = {
  title: 'Nexus Invoicing Web Console',
  description: 'Clean Room Mini ERP Interface UI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}`;
writeFile('apps/frontend/src/app/layout.tsx', layoutTsx);

// 16. Frontend Application Core Page connected to API endpoints
const pageTsx = `
"use client";
import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api/v1';

export default function page() {
  const [token, setToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // App States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Entities Data
  const [summary, setSummary] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // CRM Customer Form State
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Invoice Form State
  const [selectedCustId, setSelectedCustId] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [items, setItems] = useState<any[]>([{ description: '', quantity: 1, price: 0 }]);

  // Load Session on init
  useEffect(() => {
    const savedToken = localStorage.getItem('nexus_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Fetch core telemetry when Token is valid
  useEffect(() => {
    if (token) {
      fetchDashboardData();
      fetchCustomers();
      fetchInvoices();
    }
  }, [token]);

  // Network Fetch Implementations
  const fetchDashboardData = async () => {
    try {
      const res = await fetch(\`\${API_BASE}/dashboard/summary\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (res.ok) setSummary(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(\`\${API_BASE}/customers\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (res.ok) setCustomers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch(\`\${API_BASE}/invoices\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (res.ok) setInvoices(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Auth Submit Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const pathUrl = isRegistering ? '/auth/register' : '/auth/login';
    const payload = isRegistering ? { email, password, name } : { email, password };

    try {
      const res = await fetch(\`\${API_BASE}\${pathUrl}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication error');
      }

      if (isRegistering) {
        setSuccessMsg('Account registered successfully! Please log in.');
        setIsRegistering(false);
      } else {
        localStorage.setItem('nexus_token', data.token);
        setToken(data.token);
        setSuccessMsg('Logged into ERP engine successfully!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection to ERP engine failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
  };

  // CRM Create handler
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(\`\${API_BASE}/customers\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ name: custName, email: custEmail, phone: custPhone, address: custAddress })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Customer creation error');
      
      setSuccessMsg('Customer catalog record saved.');
      setCustName('');
      setCustEmail('');
      setCustPhone('');
      setCustAddress('');
      fetchCustomers();
      fetchDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // CRM Delete handler
  const handleDeleteCustomer = async (id: string) => {
    setErrorMsg('');
    try {
      const res = await fetch(\`\${API_BASE}/customers/\${id}\`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Unable to delete client record');
      }
      setSuccessMsg('Customer record removed.');
      fetchCustomers();
      fetchDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Invoices creator logic
  const handleItemRowChange = (idx: number, field: string, value: any) => {
    const updated = items.map((item, i) => {
      if (i === idx) return { ...item, [field]: value };
      return item;
    });
    setItems(updated);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(\`\${API_BASE}/invoices\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({
          customerId: selectedCustId,
          dueDate: invoiceDueDate,
          items
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invoice generation compilation failure');

      setSuccessMsg('New Invoice generated & calculated successfully.');
      setSelectedCustId('');
      setInvoiceDueDate('');
      setItems([{ description: '', quantity: 1, price: 0 }]);
      fetchInvoices();
      fetchDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(\`\${API_BASE}/invoices/\${id}/status\`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSuccessMsg('Invoice status logs updated.');
        fetchInvoices();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Financial aggregates summary for form view
  const localFormSubtotal = items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.price || 0)), 0);

  // --- RENDERING VIEWS ---
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs bg-indigo-500/10 text-indigo-400 font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-indigo-500/20">Nexus Access</span>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">ERP Invoicing Center</h1>
          </div>

          {errorMsg && <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-200 text-xs rounded-xl">{errorMsg}</div>}
          {successMsg && <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-xs rounded-xl">{successMsg}</div>}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">User Name</label>
                <input required type="text" placeholder="Arief" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email address</label>
              <input required type="email" placeholder="user@erp.com" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Access Password</label>
              <input required type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200" />
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3.5 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20">
              {isRegistering ? 'Create Administrative Account' : 'Authenticate Console Session'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); }} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition">
              {isRegistering ? 'Already registered? Authenticate here' : 'New operator? Construct schema User'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Upper Navigation Row */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m-9 0H3m2 0H3" /></svg>
            </div>
            <span className="font-extrabold tracking-tight text-white text-base">NEXUS CONSOLE</span>
          </div>
          <button onClick={handleLogout} className="text-xs border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 px-4 py-2 rounded-xl font-bold transition text-slate-300">
            Terminate Session
          </button>
        </div>
      </header>

      {/* Main Container Dashboard UI */}
      <div className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Workspace Modules</p>
          <button onClick={() => setActiveTab('dashboard')} className={\`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition \${activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}\`}>Live Dashboard</button>
          <button onClick={() => setActiveTab('invoices')} className={\`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition \${activeTab === 'invoices' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}\`}>Invoice Manager</button>
          <button onClick={() => setActiveTab('customers')} className={\`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition \${activeTab === 'customers' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}\`}>Client Directory (CRM)</button>
        </aside>

        {/* Workspace Display */}
        <main className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col">
          {errorMsg && <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 text-red-200 text-xs rounded-xl">{errorMsg}</div>}
          {successMsg && <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs rounded-xl">{successMsg}</div>}

          {/* VIEW TAB 1: LIVE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-xl font-extrabold text-white">System Executive Dashboard</h1>
                <p className="text-slate-400 text-xs">Real-time database analytics processed directly from the NestJS Core API.</p>
              </div>

              {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Income (Paid)</p>
                    <p className="text-xl font-black text-emerald-400 mt-2">\$\${summary.totalRevenue.toFixed(2)}</p>
                    <span className="text-[9px] text-emerald-500/80 block mt-1">{summary.paidInvoicesCount} Cleared Invoices</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uncollected Receivables</p>
                    <p className="text-xl font-black text-amber-500 mt-2">\$\${summary.outstanding.toFixed(2)}</p>
                    <span className="text-[9px] text-amber-500/80 block mt-1">{summary.sentInvoicesCount} Pending Claims</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Accounts</p>
                    <p className="text-xl font-black text-white mt-2">{summary.customersCount}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">Registered Organizations</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Overdues</p>
                    <p className="text-xl font-black text-red-500 mt-2">{summary.overdueInvoicesCount}</p>
                    <span className="text-[9px] text-red-400 block mt-1">Requires Immediate Contact</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW TAB 2: INVOICES MANAGER */}
          {activeTab === 'invoices' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-xl font-extrabold text-white">Invoice Records & Ledger</h1>
                <p className="text-slate-400 text-xs">Dynamic invoice compiling flow with immediate database synchronization.</p>
              </div>

              {/* Dynamic Creator Form */}
              <form onSubmit={handleCreateInvoice} className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-6">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">Generate New Invoice</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target B2B Account</label>
                    <select required value={selectedCustId} onChange={e=>setSelectedCustId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200">
                      <option value="">-- Select Client Organization --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Settlement Due Date</label>
                    <input required type="date" value={invoiceDueDate} onChange={e=>setInvoiceDueDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200" />
                  </div>
                </div>

                {/* Invoice Items Sub-array list */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Items Ledger</label>
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-3">
                      <input required type="text" placeholder="Service or Product name" value={item.description} onChange={e=>handleItemRowChange(idx, 'description', e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 w-full" />
                      <input required type="number" placeholder="Qty" min="1" value={item.quantity} onChange={e=>handleItemRowChange(idx, 'quantity', Number(e.target.value))} className="w-20 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
                      <input required type="number" step="0.01" placeholder="Price" value={item.price} onChange={e=>handleItemRowChange(idx, 'price', Number(e.target.value))} className="w-32 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
                      <div className="w-20 text-right text-xs font-mono text-slate-400 px-2">\$\${(item.quantity * item.price).toFixed(2)}</div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setItems([...items, { description: '', quantity: 1, price: 0 }])} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition">+ Append line element</button>
                </div>

                <div className="flex justify-between items-center border-t border-slate-900 pt-4">
                  <div className="text-xs text-slate-400">VAT computed securely at 10%: <span className="font-mono text-white font-bold">\$\${(localFormSubtotal * 0.10).toFixed(2)}</span></div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Grand Charge</span>
                    <span className="text-lg font-black text-indigo-400 font-mono">\$\${(localFormSubtotal * 1.10).toFixed(2)}</span>
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3.5 rounded-xl text-xs font-bold transition">Deploy Invoicing Claims</button>
              </form>

              {/* Invoices History Table */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Invoices Ledger History</h2>
                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold">
                        <th className="p-4">Invoice #</th>
                        <th className="p-4">Organization</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4">Grand Total</th>
                        <th className="p-4">Status Log</th>
                        <th className="p-4 text-right">Lifecycle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-900/30">
                          <td className="p-4 font-mono font-bold text-indigo-400">{inv.invoiceNo}</td>
                          <td className="p-4 font-semibold">{inv.customer?.name}</td>
                          <td className="p-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                          <td className="p-4 font-bold text-white font-mono">\$\${inv.grandTotal.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={\`px-2 py-0.5 rounded text-[9px] font-bold \${inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : inv.status === 'OVERDUE' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'}\`}>{inv.status}</span>
                          </td>
                          <td className="p-4 text-right">
                            <select value={inv.status} onChange={e => handleUpdateStatus(inv.id, e.target.value)} className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300">
                              <option value="DRAFT">DRAFT</option>
                              <option value="SENT">SENT</option>
                              <option value="PAID">PAID</option>
                              <option value="OVERDUE">OVERDUE</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW TAB 3: CLIENT CRM DIRECTORY */}
          {activeTab === 'customers' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-xl font-extrabold text-white">Customers Relationship Portal</h1>
                <p className="text-slate-400 text-xs">Direct database pipeline for onboarding client organizations.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Form to onboarding client */}
                <form onSubmit={handleAddCustomer} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-900">Add New Account</h3>
                  
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company Name</label>
                    <input required type="text" value={custName} onChange={e=>setCustName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Email</label>
                    <input required type="email" value={custEmail} onChange={e=>setCustEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Direct Phone</label>
                    <input type="text" value={custPhone} onChange={e=>setCustPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Address</label>
                    <textarea value={custAddress} onChange={e=>setCustAddress(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 min-h-[50px]" />
                  </div>

                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-lg text-xs font-bold transition">Onboard Organization</button>
                </form>

                {/* Registry View */}
                <div className="lg:col-span-2 border border-slate-800 bg-slate-950 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-900/40 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Client Directory Ledger</span>
                  </div>
                  <div className="divide-y divide-slate-800/50">
                    {customers.map(c => (
                      <div key={c.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-900/10">
                        <div>
                          <div className="font-bold text-white text-sm">{c.name}</div>
                          <div className="text-slate-400 mt-0.5">{c.email}</div>
                          {c.phone && <div className="text-slate-500 mt-0.5">📞 {c.phone}</div>}
                        </div>
                        <button onClick={() => handleDeleteCustomer(c.id)} className="text-red-400 hover:text-red-300 font-bold tracking-wide transition">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
`;
writeFile('apps/frontend/src/app/page.tsx', pageTsx);

console.log("\n🔥 Integrated Swagger Workspace Generated successfully!");
console.log("👉 Run the setup command sequence below in your folder console to start:");
console.log("----------------------------------------");
console.log("1. Run:  npm install");
console.log("2. Run:  npm run db:migrate");
console.log("3. Run:  npm run dev:backend   (Port 3000 API Engine + Swagger UI at /api-docs)");
console.log("4. Run:  npm run dev:frontend  (Port 3001 Live Web Console)");
console.log("----------------------------------------");