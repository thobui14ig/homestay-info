import { IsArray, IsNumber, IsString } from "class-validator";

export class CreateKeywordDto {
    @IsArray({ message: "Danh sách truyền lên phải là 1 mảng" })
    @IsString({ each: true, message: "Keyword phải là string" })
    keywords: string[]

    @IsNumber()
    linkId: number
}
