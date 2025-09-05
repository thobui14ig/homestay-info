import { IsArray, IsEnum, IsString } from "class-validator";
import { TokenHandle } from "../entities/token.entity";

export class CreateTokenDto {
    @IsArray({ message: "Danh sách truyền lên phải là 1 mảng" })
    @IsString({ each: true, message: "Token phải là string" })
    tokens: string[]

    // @IsEnum(TokenHandle)
    type: TokenHandle
}
