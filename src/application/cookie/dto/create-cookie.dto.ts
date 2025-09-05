import { IsArray, IsString } from "class-validator";

export class CreateCookieDto {
    @IsArray({ message: "Danh sách truyền lên phải là 1 mảng" })
    @IsString({ each: true, message: "Cookie phải là string" })
    cookies: string[]
}
