import { IsString, IsArray, IsNumber, IsOptional, ValidateNested, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QuotationItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @IsNumber() @Min(0.001) quantity: number;
  @ApiProperty() @IsNumber() @Min(0) unitPrice: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ required: false }) @IsNumber() @Min(0) @IsOptional() width?: number;
  @ApiProperty({ required: false }) @IsNumber() @Min(0) @IsOptional() height?: number;
}

export class CreateQuotationDto {
  @ApiProperty() @IsString() clientId: string;

  @ApiProperty({ type: [QuotationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
  @ApiProperty({ required: false }) @IsDateString() @IsOptional() validUntil?: string;
  @ApiProperty({ required: false }) @IsNumber() @Min(0) @IsOptional() installationCost?: number;
}
