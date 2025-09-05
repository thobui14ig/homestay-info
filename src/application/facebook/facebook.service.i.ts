import { LinkType } from "../links/entities/links.entity";

export interface IGetProfileLinkResponse {
    type: LinkType,
    name?: string,
    postId?: string,
}

export interface ICommentResponse {
    commentId: string,
    userNameComment: string,
    commentMessage: string,
    phoneNumber: string,
    userIdComment: string,
    commentCreatedAt: string,
}

export const FB_UUID = [
    {
        mail: "Beewisaka@gmail.com",
        key: "d8145c6a-ca2f-4951-935d-56b77f6d792a"
    },
    {
        mail: "chuongk57@gmail.com",
        key: "cebd28c8-f61d-4b2a-a9f5-dc9cec2c5aa6"
    }
]
