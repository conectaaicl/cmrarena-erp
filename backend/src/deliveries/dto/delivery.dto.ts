import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { DeliveryStatus } from '@prisma/client';

export class ServiceFieldDto {
  key: string;
  label: string;
  value: string;
  secret?: boolean;
}

export class ServiceBlockDto {
  type: string;
  label: string;
  icon?: string;
  fields: ServiceFieldDto[];
}

export class CreateDeliveryDto {
  @IsString() clientId: string;
  @IsOptional() @IsString() quotationId?: string;
  @IsString() title: string;
  @IsOptional() @IsArray() services?: ServiceBlockDto[];
  @IsOptional() @IsString() notes?: string;
}

export class UpdateDeliveryDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsEnum(DeliveryStatus) status?: DeliveryStatus;
  @IsOptional() @IsArray() services?: ServiceBlockDto[];
  @IsOptional() @IsString() notes?: string;
}
