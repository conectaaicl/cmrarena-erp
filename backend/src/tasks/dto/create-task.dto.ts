import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TaskStatus {
  PENDIENTE = 'PENDIENTE',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

export enum TaskPriority {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

export class CreateTaskDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() clientId?: string;
  @ApiProperty({ required: false }) @IsDateString() @IsOptional() dueDate?: string;
  @ApiProperty({ required: false, enum: TaskStatus }) @IsEnum(TaskStatus) @IsOptional() status?: TaskStatus;
  @ApiProperty({ required: false, enum: TaskPriority }) @IsEnum(TaskPriority) @IsOptional() priority?: TaskPriority;
}
