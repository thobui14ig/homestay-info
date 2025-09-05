import { LinkType } from "src/application/links/entities/links.entity";

export interface IFacebookResponse {
    comments: {
        data: FacebookComment[]
    }
    from: {
        name: string;
        category: string;
        category_list: Array<{
            id: string;
            name: string;
        }>;
        id: string;
    };
    icon: string;
    name: string;
    picture: string;
    source: string;
    id: string;
    message: string,
    description: string
}

interface FacebookComment {
    created_time: string; // ISO 8601 format date string
    from: {
        name: string;
        id: string;
    };
    message: string;
    can_remove: boolean;
    like_count: number;
    user_likes: boolean;
    id: string;
}

export interface IGetInfoLinkResponse {
    id?: string,
    linkName?: string,
    pageId?: string,
    linkType: LinkType,
    content?: string
}