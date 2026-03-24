import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Mi Empresa SPA' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'mi-empresa' })
  @IsString() @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Admin' })
  @IsString() @IsNotEmpty()
  adminFirstName: string;

  @ApiProperty({ example: 'González' })
  @IsString() @IsNotEmpty()
  adminLastName: string;

  @ApiProperty({ example: 'admin@miempresa.cl' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString() @MinLength(8)
  adminPassword: string;
}

export class UpdateTenantDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() primaryColor?: string;
  @IsOptional() taxRate?: number;
  @IsString() @IsOptional() logoUrl?: string;
}
