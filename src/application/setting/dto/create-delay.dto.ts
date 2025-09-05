import { IsNumber } from "class-validator";

export class CreateDelayDTO {
    @IsNumber()
    refreshToken: number;

    @IsNumber()
    refreshCookie: number;

    @IsNumber()
    refreshProxy: number;
}