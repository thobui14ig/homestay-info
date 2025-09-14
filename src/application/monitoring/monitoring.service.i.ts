import { LinkEntity, LinkStatus, LinkType } from "../links/entities/links.entity";

export interface GroupedLinksByType {
    public: LinkEntity[];
    private: LinkEntity[];
}

export interface IPostStarted {
    postId: string,
    status: LinkStatus,
    type: LinkType
}

export enum KEY_PROCESS_QUEUE {
    ADD_COMMENT = 'add-comment'
}

export const FB_UUID = [
    {
        mail: "Beewisaka@gmail.com",
        key: "5f00db79-553d-4f3f-b1ba-af7a6faad5b6"
    },
    {
        mail: "chuongk57@gmail.com",
        key: "d383628f-0a52-4e84-ac28-4ae0b0716486"
    }
]
