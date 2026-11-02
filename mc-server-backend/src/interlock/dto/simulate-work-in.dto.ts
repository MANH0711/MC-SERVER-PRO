import { IsOptional, IsString } from 'class-validator';

export class SimulateWorkInDto {
  @IsOptional()
  @IsString()
  equipmentId?: string;

  @IsOptional()
  @IsString()
  plant?: string;

  @IsOptional()
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @IsString()
  operation?: string;

  @IsOptional()
  @IsString()
  config?: string;

  @IsOptional()
  @IsString()
  recipe?: string;

  @IsOptional()
  @IsString()
  pcbId?: string;

  @IsOptional()
  @IsString()
  transTime?: string;

  @IsOptional()
  @IsString()
  rawMessage?: string;
}
