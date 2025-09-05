export interface IFacebookUser {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    username: string;
    link: string;
    locale: string;
    is_employee: boolean;
    updated_time: string;
    hometown: {
        id: string;
        name: string;
    };
    location: {
        id: string;
        name: string;
    };
}
