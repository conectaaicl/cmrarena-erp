import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export enum CaPlanTipo {
  WEB_BASICA = 'WEB_BASICA',
  WEB_PRO = 'WEB_PRO',
  ECOMMERCE = 'ECOMMERCE',
  AUTOMATIZACION = 'AUTOMATIZACION',
  BOT_WA = 'BOT_WA',
  HOSTING = 'HOSTING',
  DOMINIO = 'DOMINIO',
  MANTENCION = 'MANTENCION',
  PERSONALIZADO = 'PERSONALIZADO',
}

export enum CaClienteEstado {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  PROSPECTO = 'PROSPECTO',
}

export class CreateCaClienteDto {
  @IsString() nombre: string;
  @IsOptional() @IsString() empresa?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() pais?: string;
  @IsOptional() @IsEnum(CaPlanTipo) plan?: CaPlanTipo;
  @IsOptional() @IsNumber() montoMensual?: number;
  @IsOptional() @IsEnum(CaClienteEstado) estado?: CaClienteEstado;
  @IsOptional() @IsString() notas?: string;
}

export class UpdateCaClienteDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() empresa?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() pais?: string;
  @IsOptional() @IsEnum(CaPlanTipo) plan?: CaPlanTipo;
  @IsOptional() @IsNumber() montoMensual?: number;
  @IsOptional() @IsEnum(CaClienteEstado) estado?: CaClienteEstado;
  @IsOptional() @IsString() notas?: string;
  @IsOptional() @IsString() omniflowId?: string;
}
