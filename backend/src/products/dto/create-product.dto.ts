import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'PER-001' }) @IsString() sku: string;
  @ApiProperty({ example: 'Persiana Roller Blackout' }) @IsString() name: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ example: 'Persianas' }) @IsString() category: string;
  @ApiProperty({ example: 15000 }) @IsNumber() @Min(0) cost: number;
  @ApiProperty({ example: 25000 }) @IsNumber() @Min(0) price: number;
  @ApiProperty({ example: 50 }) @IsNumber() @Min(0) stock: number;
  @ApiProperty({ example: 5 }) @IsNumber() @Min(0) minStock: number;
  @ApiProperty({ example: 'un.', required: false }) @IsString() @IsOptional() unit?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class AdjustStockDto {
  @ApiProperty({ example: 10 }) @IsNumber() quantity: number;
  @ApiProperty({ example: 'Compra a proveedor', required: false }) @IsString() @IsOptional() reason?: string;
}
