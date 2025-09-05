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