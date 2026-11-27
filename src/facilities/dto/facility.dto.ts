import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { FacilityType } from '@prisma/client';

export class CreateFacilityDto {
  @ApiProperty({ example: 'Central City Hospital' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: FacilityType })
  @IsEnum(FacilityType)
  type: FacilityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateFacilityDto extends PartialType(CreateFacilityDto) {}

export class SetFacilityStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
