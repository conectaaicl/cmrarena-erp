import { IsString, IsEmail, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ClientStatus } from '@prisma/client';

export class CreateClientDto {
  @ApiProperty({ example: 'Empresa ABC Ltda.' })
  @IsString()
  name: string;

  @ApiProperty({ example: '12.345.678-9' })
  @IsString()
  rut: string;

  @ApiProperty({ example: 'contacto@empresa.cl', required: false })
  @IsEmail() @IsOptional()
  email?: string;

  @ApiProperty({ required: false }) @IsString() @IsOptional() phone?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() address?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() commune?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() city?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() giro?: string;
  @ApiProperty({ required: false, example: 'https://empresa.cl' }) @IsString() @IsOptional() website?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() contactName?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
  @ApiProperty({ required: false, type: [String] }) @IsArray() @IsOptional() tags?: string[];
  @ApiProperty({ required: false, enum: ClientStatus }) @IsEnum(ClientStatus) @IsOptional() status?: ClientStatus;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {}
