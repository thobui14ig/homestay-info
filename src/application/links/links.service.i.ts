import { UserEntity } from "../user/entities/user.entity";
import { CreateLinkDTO } from "./dto/create-link.dto";
import { LinkType } from "./entities/links.entity";

export interface CreateLinkParams extends CreateLinkDTO {
    userId: number
}

export interface BodyLinkQuery {
    type: LinkType
    lastCommentFrom?: number
    lastCommentTo?: number
    differenceCountCmtFrom?: number
    differenceCountCmtTo?: number
    delayFrom?: number
    delayTo?: number
    likeFrom?: number
    likeTo?: number
    userId: number
}

export interface ISettingLinkDto {
    isDelete: boolean
    onOff: boolean
    delay: number
    linkIds: number[]
}