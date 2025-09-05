import { HttpService } from "@nestjs/axios";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs";
import { changeCookiesFb, formatCookies, getHttpAgent } from "src/common/utils/helper";
import { CommentEntity } from "src/application/comments/entities/comment.entity";
import { CookieEntity, CookieStatus } from "src/application/cookie/entities/cookie.entity";
import { HideBy } from "src/application/links/entities/links.entity";
import { ProxyService } from "src/application/proxy/proxy.service";
import { KeywordEntity } from "src/application/setting/entities/keyword";
import { TokenService } from "src/application/token/token.service";
import { Repository } from "typeorm";

interface IcookieRes {
    id: number,
    facebookId: any,
    fbDtsg: any,
    jazoest: any
}
@Injectable()
export class HideCommentUseCase {
    cookieRes: IcookieRes[] = []

    constructor(private readonly httpService: HttpService,
        private proxyService: ProxyService,
        private tokenService: TokenService,
        @InjectRepository(CookieEntity)
        private cookieRepository: Repository<CookieEntity>,
        @InjectRepository(CommentEntity)
        private commentRepository: Repository<CommentEntity>,
    ) {
    }

    async hideComment(type: HideBy, postId: string, comment: CommentEntity, keywords: KeywordEntity[], cookie: CookieEntity) {
        console.log("🚀 ~ HideCommentUseCase ~ hideComment ~ cookie:", cookie)
        if (!cookie) {
            throw new HttpException(
                `không tìm thấy cookie.`,
                HttpStatus.BAD_REQUEST,
            );
        }
        let isHide = this.checkHide(type, comment, keywords)
        console.log("🚀 ~ HideCommentUseCase ~ hideComment ~ isHide:", isHide)

        if (isHide) {
            let res = null
            if ("i_user".includes(cookie.token) || !cookie.token) {
                const cmtDecode = btoa(`comment:${postId}_${comment.cmtId}`)
                res = await this.callApihideCmt(cmtDecode, cookie)
            } else {
                res = await this.callApiHideCmtWithToken(comment.cmtId, cookie)
            }
            if (res) {
                await this.commentRepository.save({ ...comment, hideCmt: true })
            }
        }
    }

    checkHide(type: HideBy, comment: CommentEntity, keywords: KeywordEntity[]) {
        let isHide = false

        if (type === HideBy.ALL || (type === HideBy.PHONE && comment.phoneNumber)) {
            isHide = true
            return isHide
        }


        if (type === HideBy.KEYWORDS) {
            for (const keyword of keywords) {
                if (comment.message.includes(keyword.keyword)) {
                    isHide = true
                    return isHide
                }
            }
        }

        return isHide
    }

    async callApiHideCmtWithToken(cmtId: string, cookie: CookieEntity) {
        console.log("🚀 ~ HideCommentUseCase ~ callApiHideCmtWithToken ~ callApiHideCmtWithToken:")
        try {
            const tokenPage = await this.getTokenPage(cookie.token)
            if (!tokenPage) {
                return false
            }
            const response = await firstValueFrom(
                this.httpService.post(`https://graph.facebook.com/v23.0/${cmtId}`, {
                    "is_hidden": true,
                    "access_token": tokenPage
                }),
            );

            console.log("🚀 ~ HideCommentUseCase ~ callApiHideCmtWithToken ~ response.data:", response.data)
            return response.data?.success || false
        } catch (error) {
            console.log("🚀 ~ HideCommentUseCase ~ callApiHideCmtWithToken ~ error.response?.data:", error.response?.data)
            if (error.response?.data?.error?.code === 100 || error.response?.data?.error?.code === 190) {
                await this.cookieRepository.update(cookie.id, { status: CookieStatus.DIE })
            }
            return false
        }
    }

    async getTokenPage(tokenUser: string,) {
        const response = await firstValueFrom(
            this.httpService.get(`https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenUser}`),
        );

        return response.data?.data?.[0]?.access_token
    }
    async callApihideCmt(cmtId: string, cookie: CookieEntity) {
        console.log("🚀 ~ HideCommentUseCase ~ callApihideCmt ~ callApihideCmt:", cookie)
        try {
            const proxy = await this.proxyService.getRandomProxy()
            const httpsAgent = getHttpAgent(proxy)
            const cookies = changeCookiesFb(cookie.cookie);

            if (!cookie.fbId) { //cookie die
                await this.cookieRepository.save({ ...cookie, status: CookieStatus.DIE })
                return false
            }

            if (!proxy) {
                return false
            }

            const data = {
                av: cookie.fbId,
                __aaid: '0',
                __user: cookie.fbId,
                __a: '1',
                __req: '1c',
                __hs: '20235.HYP:comet_pkg.2.1...0',
                dpr: '1',
                __ccg: 'EXCELLENT',
                __rev: '1023204200',
                __s: '8iww8r:ezx19i:v2za4k',
                __hsi: '7509172227721751248',
                __dyn: '7xeXzWK1ixt0mUyEqxemh0noeEb8nwgUao4ubyQdwSwAyUco5S3O2Saw8i2S1DwUx60GE3Qwb-q7oc81EEbbwto88422y11wBz83WwgEcEhwGxu782lwv89kbxS1Fwc61awkovwRwlE-U2exi4UaEW2au1jwUBwJK14xm3y11xfxmu3W3y261eBx_wHwUwa67EbUG2-azqwaW223908O3216xi4UK2K2WEjxK2B08-269wkopg6C13xe3a3Gfw-KufxamEbbxG1fBG2-2K0E846fwk8eo3ww',
                __csr: 'gfclNAdMzNIrs5k9T4ltNdSyWbd5MnROTtZFR7Pq9HRQMDFICi-LJdnmGTK_dsGOvlQGqpZkWl9tQxhkhpvRGykmJ2-AHjHFqLEzp5QJGRJkAiQiWKnBQt5gLDVFAjmKAb8hbLWKSAUhCtZHGuiVAla8VWBZ94VbjhFKF99aCLGppZeHAHggGHAgGh5Dx6nCGaiy-9KaHBim9zWyEyFaChFdu4ojVqiACHxm9Ax6Voyi5oHF29prxmUhyk9DBLADAzoOEx4h9UC7ohzXAxiF99Z1rUymfgOdxha4KhXXJGdCxueKDF4K6GgZx22O9y8pykFKudACzUC2adyogK8GUyibzEC2C3Snxe48yqXUmyE8UyE9U5R0hoqkw9oKuu684e226GwEyUTg8p8b86Gi0zC1vAxm1IKDws87Kq1lCDxzoC13Q1GCZmdwprUfEGcDyGz9A9g5104_wRw9G1ijh_gvwGzE8bybAypK3S0Qo4S0MEgqJBQ5rAyopqy8xaUjUGbkE5mh0e21jQ320Bo4CfzoK5J0RwHwCwRx2eDy8vDDwww0FQw3EU0ixyU0FO0tBk0Jm6U0Gi0pK00ZTE3Sw6mwh8c84qaCw2680Ia0CEe40Y406gEhwgQm0CU7G0m20-U0wm19w1h10no3Pw2YE0Te1Ewb_woqxi35Cy4bw2mU25w2hE2ByU1_Uzg1d85uagF2F80tKc04We05zk0vm4E0zm0jaE6m8O0jIx9U17cwW1Lw4rxG0ri0hO1Uwbx0ho0o1w9O8T81RwmUyb7iwMwZwto0zC8Q',
                __hsdp: 'gc41882ewCgQy7A55GjAeO4hAuy2VBoQY4F22F19kR9XSN14uCqCtIaQQGiloPgmeKkB8tAnAdgxIiyyGr42SlAm_8kxih2PxVkygDJ6SX9qb4r4eyN4aiMx1YFa1sBOPTkAasaMKmKxD2uFa4mkh7IP4Zhf2YNABFFRgKBpkCh8ygBBO7A4a96FmkgKQIkyt58GhiqH8FP6mInjc4GWSCNlNhnQVczAOyiebXJan8SOKpesPVyBowxa8TUJA52_6BGaBF7avCEyDGhcHy48aF4zBFeuAEVeu6HAyCXmjgGbOEkbgCAaBoak68x5xJoB6zp9orwFBzSZ2agbkdgh8fjaq58targPgW32-W8R4PDz88V49J3SgaP3oSaoryV8gg4CUKfwzBoSpamVi2FXpbhm5obkbJ5h4en82i2i2y3aEcUixx0goCpxa6pUiz9pox2Qqh4oeE2gwiEOqyfsmEK8wFy8k_goxF8M-ag88vxQEqxnhUbEWi78hgC3m21114yr3Egxucxt28ptKQ7o-2am8odA16hUtg4bIE2DK2zwzByU5q3i365E8E6pwOwFwHwkUG4Q4U21wFyUoCwhU72jwpobUmG3O125wmo884ec8684W1-xl05kzpGyo2LwIg-3u3O0IA1hzUiz8hBxW3edwTwOUao3JBwTBzpo720wE4a3u0Vohwt86-1ZxC220hu0BUW14waS0VErK4Uy68ak2e5Uy1SDCze1OwdiU6S2q0z42W6o20xG1ywlu7EcF8gwTwkU0T2Uy4UG1IwtU6S0Bo7Wbwv_xO0PU3HwwwMxG22E28w2bEbEbu6osg3xw',
                __hblp: '0qd08F1t447iykbx26V8K1jwrEbEkxC1aG3G1vxe1GxC0Y9o5C5E8UnAypUN0921SG3CeCwxwMxe48K2KqbByUvx2ewFwByE9U2JwpEaEjzEJ0QxWbxu68O3u3K1owmp8swgGw9adzU8VUowAxu15x2bzUowoocGxy2S6mt0n88ovxi220HU6uczUvy8owKxZ1-3-3XwYwZwxwywoV8C7Ea8S5UC6E6V0Swi89E4ibwda19wgE6q3Cu6ovxu11CxuawHwTxK7U2_wHwwwCwm8nAUiBwzwm9ogG3N0ywxwXwAwwwr9oC3KE7W5k0x8O2Kdzo8o5y260BUnzEtg-1QCwzwce2q8w8615z89u2C4UeU2tBwRxm0iy4UbE3Kx6m222mm7rxa1swvopwww4nwrEa8W14xy0B83CxKUjy8owFg8Uny87quqcU7a4USfho2mAK1JwCw8N0KxC2a1txmbzoszUTx22u4E-aUK4E8ogAx23u3W583-wjE3DwlUiw9u3uUy8xaz0cq5qwiU8o9U6S1-yU651Ju785W7oW4EK2i0WU7WeG1rw2mawKwJUpDxh0e6',
                __comet_req: '15',
                fb_dtsg: cookie.fbDtsg,
                jazoest: cookie.jazoest,
                lsd: 'BQthffrujiJFA2Lct_sKIe',
                __spin_r: '1023204200',
                __spin_b: 'trunk',
                __spin_t: '1748365403',
                __crn: 'comet.fbweb.CometProfileTimelineListViewRoute',
                fb_api_caller_class: 'RelayModern',
                fb_api_req_friendly_name: 'CometUFIHideCommentMutation',
                variables: `{"input":{"comment_id":"${cmtId}","feedback_source":0,"hide_location":"MENU","site":"comet","actor_id":"${cookie.fbId}","client_mutation_id":"1"},"feedLocation":"TIMELINE","useDefaultActor":false,"scale":1,"__relay_internal__pv__CometUFI_dedicated_comment_routable_dialog_gkrelayprovider":false}`,
                server_timestamps: 'true',
                doc_id: '9829593003796713'
            }

            const response = await firstValueFrom(
                this.httpService.post("https://www.facebook.com/api/graphql/", new URLSearchParams(data).toString(), {
                    "headers": {
                        "accept": "*/*",
                        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                        "content-type": "application/x-www-form-urlencoded",
                        "priority": "u=1, i",
                        "sec-ch-prefers-color-scheme": "light",
                        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
                        "sec-ch-ua-full-version-list": "\"Chromium\";v=\"136.0.7103.114\", \"Google Chrome\";v=\"136.0.7103.114\", \"Not.A/Brand\";v=\"99.0.0.0\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-model": "\"\"",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-ch-ua-platform-version": "\"10.0.0\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-asbd-id": "359341",
                        "x-fb-friendly-name": "CometUFIHideCommentMutation",
                        "x-fb-lsd": "BQthffrujiJFA2Lct_sKIe",
                        "cookie": formatCookies(cookies),
                        "Referrer-Policy": "strict-origin-when-cross-origin"
                    },
                    httpsAgent,
                }),
            );

            console.log("🚀 ~ HideCommentUseCase ~ callApihideCmt ~ response.data:", response.data)

            if (response.data?.errors?.length > 0) {
                return false
            }
            return true
        } catch (error) {
            console.log("🚀 ~ HideCommentUseCase ~ callApihideCmt ~ error.response?.data:", error.response?.data)
            if (error.response?.data?.error?.code === 100) {
                await this.cookieRepository.update(cookie.id, { status: CookieStatus.DIE })
            }
            console.log("🚀 ~ HideCommentUseCase ~ callApihideCmt ~ error:", error?.message)
            return false
        }
    }

    async getInfoAccountsByCookie(cookie: string) {
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const proxy = await this.proxyService.getRandomProxy();
                if (!proxy) return null
                const httpsAgent = getHttpAgent(proxy);
                const cookies = changeCookiesFb(cookie);

                const dataUser = await firstValueFrom(
                    this.httpService.get('https://www.facebook.com', {
                        headers: {
                            Cookie: formatCookies(cookies),
                        },
                        httpsAgent,
                    }),
                );

                const dtsgMatch = dataUser.data.match(/DTSGInitialData",\[\],{"token":"(.*?)"}/);
                const jazoestMatch = dataUser.data.match(/&jazoest=(.*?)"/);
                const userIdMatch = dataUser.data.match(/"USER_ID":"(.*?)"/);

                if (dtsgMatch && jazoestMatch && userIdMatch) {
                    const fbDtsg = dtsgMatch[1];
                    const jazoest = jazoestMatch[1];
                    const facebookId = userIdMatch[1];
                    return { fbDtsg, jazoest, facebookId };
                }

            } catch (error) {
                console.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
            }

            // Optional: delay giữa các lần thử (nếu cần tránh spam)
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 giây
        }

        // Sau 3 lần đều fail
        return null;
    }

}

