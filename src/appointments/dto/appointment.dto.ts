import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  clinicianId: string;

  @ApiProperty({ example: '2024-12-25T10:00:00Z' })
  @IsString()
  scheduledAt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto {
  @ApiProperty({ enum: ['requested', 'confirmed', 'completed', 'cancelled'] })
  @IsOptional()
  @IsIn(['requested', 'confirmed', 'completed', 'cancelled'])
  status?: AppointmentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
