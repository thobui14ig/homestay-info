
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { LinkType } from "../entities/links.entity";

export class UpdateLinkDTO {
    @IsNumber()
    id: number;

    @IsString()
    @IsOptional()
    linkName: string;

    @IsEnum(LinkType)
    @IsOptional()
    type?: LinkType;

    @IsNumber()
    @IsOptional()
    delayTime?: number;

    @IsBoolean()
    @IsOptional()
    hideCmt?: boolean;
}