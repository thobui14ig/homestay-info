import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LinkStatus } from '../entities/links.entity';
import { Optional } from '@nestjs/common';
import { Type } from 'class-transformer';

class LinkDto {
  @IsString()
  @Matches(/^https:\/\/www\.facebook\.com\//, {
    message: 'Nội dung phải bắt đầu bằng "https://www.facebook.com/"',
  })
  @MinLength(1, { message: 'Nội dung không được bỏ trống' })
  url: string;

  @IsString()
  @IsOptional()
  name?: string

  @IsNumber()
  @Optional()
  delayTime?: number;
}

export class CreateLinkDTO {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  links: LinkDto[];

  @IsEnum(LinkStatus)
  status: LinkStatus;

  @IsBoolean()
  hideCmt: boolean
}
