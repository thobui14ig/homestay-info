import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
  @IsString()
  username: string;

  @IsNumber()
  @IsOptional()
  level?: number;

  @IsNotEmpty()
  @IsString()
  password: string;

  // @IsDateString()
  expiredAt: Date

  @IsNumber()
  @IsOptional()
  linkAddLimit?: number

  @IsNumber()
  @IsOptional()
  linkStartLimit?: number
}
