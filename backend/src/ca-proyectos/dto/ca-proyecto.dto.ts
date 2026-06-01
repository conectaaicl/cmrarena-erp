import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';

export enum CaProyectoTipo {
  WEB = 'WEB',
  ECOMMERCE = 'ECOMMERCE',
  AUTOMATIZACION = 'AUTOMATIZACION',
  BOT_WA = 'BOT_WA',
  HOSTING = 'HOSTING',
  DOMINIO = 'DOMINIO',
  SEO = 'SEO',
  PERSONALIZADO = 'PERSONALIZADO',
}

export enum CaProyectoEstado {
  DEV = 'DEV',
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  CANCELADO = 'CANCELADO',
  TERMINADO = 'TERMINADO',
}

export class CreateCaProyectoDto {
  @IsString() clienteId: string;
  @IsString() nombre: string;
  @IsEnum(CaProyectoTipo) tipo: CaProyectoTipo;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() stack?: string;
  @IsOptional() @IsEnum(CaProyectoEstado) estado?: CaProyectoEstado;
  @IsOptional() @IsNumber() montoMensual?: number;
  @IsOptional() @IsDateString() fechaInicio?: string;
  @IsOptional() @IsDateString() fechaFin?: string;
  @IsOptional() @IsString() notas?: string;
  @IsOptional() @IsString() sistema?: string;
}

export class UpdateCaProyectoDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsEnum(CaProyectoTipo) tipo?: CaProyectoTipo;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() stack?: string;
  @IsOptional() @IsEnum(CaProyectoEstado) estado?: CaProyectoEstado;
  @IsOptional() @IsNumber() montoMensual?: number;
  @IsOptional() @IsDateString() fechaInicio?: string;
  @IsOptional() @IsDateString() fechaFin?: string;
  @IsOptional() @IsString() notas?: string;
  @IsOptional() @IsString() sistema?: string;
}
