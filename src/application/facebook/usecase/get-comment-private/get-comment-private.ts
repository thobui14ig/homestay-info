import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { Injectable } from '@nestjs/common';
import { ProxyService } from 'src/application/proxy/proxy.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { changeCookiesFb, extractPhoneNumber, formatCookies, getHttpAgent, getRandomNumber, handleDataComment } from 'src/common/utils/helper';
import { faker } from '@faker-js/faker';
import { TokenService } from 'src/application/token/token.service';
import { TokenStatus } from 'src/application/token/entities/token.entity';
import { LinkEntity, LinkType } from 'src/application/links/entities/links.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IGetCmtPrivateResponse } from './get-comment-private.i';
import { RedisService } from 'src/infra/redis/redis.service';
import { CheckLinkUseCase } from '../check-link-status/check-link-status-usecase';
import { ICheckLinkStatus } from '../check-link-status/check-link-status-usecase.i';
import { isArray } from 'class-validator';
import { ProxyEntity } from 'src/application/proxy/entities/proxy.entity';
import { CookieService } from 'src/application/cookie/cookie.service';
import { CookieStatus } from 'src/application/cookie/entities/cookie.entity';
import { SettingService } from 'src/application/setting/setting.service';
dayjs.extend(utc);

interface IUniqueProxyCookie {
    cookieId: number,
    proxy: ProxyEntity
}

interface IUniqueProxyToken {
    tokenId: number,
    proxy: ProxyEntity
}
@Injectable()
export class GetCommentPrivateUseCase {
    uniqueCookieProxy: IUniqueProxyCookie[] = []
    uniqueTokenProxy: IUniqueProxyToken[] = []
    fbUrl = 'https://www.facebook.com';
    fbGraphql = `https://www.facebook.com/api/graphql`;

    constructor(private readonly httpService: HttpService,
        private proxyService: ProxyService,
        private tokenService: TokenService,
        @InjectRepository(LinkEntity)
        private linkRepository: Repository<LinkEntity>,
        private redisService: RedisService,
        private checkLinkUseCase: CheckLinkUseCase,
        private cookieService: CookieService,
        private settingService: SettingService,
    ) { }

    async getCommentPrivate(postId: string, postIdV1?: string): Promise<IGetCmtPrivateResponse | null> {
        const random = getRandomNumber()
        let dataComment = await this.getCommentByToken(postId)
        // if (random % 2 === 0) {
        //     dataComment = await this.getCommentWithCookie(postId, postIdV1)

        //     if ((!dataComment || !(dataComment as any)?.commentId)) {
        //         dataComment = await this.getCommentByToken(postId)
        //     }

        // } else {
        //     dataComment = await this.getCommentByToken(postId)

        //     if ((!dataComment || !(dataComment as any)?.commentId)) {
        //         dataComment = await this.getCommentWithCookie(postId, postIdV1)
        //     }
        // }

        if (dataComment?.data?.commentId) {
            const key = `${postId}_${dataComment?.data?.commentCreatedAt.replaceAll("-", "").replaceAll(" ", "").replaceAll(":", "")}`
            const isExistKey = await this.redisService.checkAndUpdateKey(key)
            if (!isExistKey) {
                return {
                    hasData: dataComment.hasData,
                    data: dataComment.data
                }
            }
        }

        return {
            hasData: false,
            data: null
        }
    }

    async getCommentByToken(postId: string) {
        let proxy = null
        const token = await this.tokenService.getTokenCrawCmtActiveFromDb()
        if (!token) return null
        const defaultProxy = this.uniqueTokenProxy.find(item => item.tokenId === token.id)
        if (defaultProxy) {
            const isLive = this.proxyService.proxies.some(item => item.id === defaultProxy.proxy.id)
            if (!isLive) { //die
                const newProxy = await this.proxyService.getRandomProxy()
                proxy = newProxy
                defaultProxy.proxy = newProxy
            } else {
                proxy = defaultProxy.proxy
            }
        } else {
            const newProxy = await this.proxyService.getRandomProxy()
            this.uniqueTokenProxy.push({
                tokenId: token.id,
                proxy: newProxy
            })
            proxy = newProxy
        }

        try {
            if (!proxy || !token) {
                return null
            }
            const httpsAgent = getHttpAgent(proxy)
            const delay = this.settingService.delay

            const headers = {
                'authority': 'graph.facebook.com',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="99", "Opera";v="85"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'upgrade-insecure-requests': '1',
                'user-agent': "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'sec-fetch-site': 'none',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-user': '?1',
                'sec-fetch-dest': 'document',
                'accept-language': "en-US,en;q=0.9,vi;q=0.8",
            };

            const params = {
                "order": "reverse_chronological",
                "limit": "1000",
                "access_token": token.tokenValueV1,
                "created_time": "created_time"
            }

            const start = Date.now();

            const res = await firstValueFrom(
                this.httpService.get(`https://graph.facebook.com/${postId}/comments`, {
                    headers,
                    httpsAgent,
                    params
                }),
            );
            const end = Date.now();
            const duration = (end - start) / 1000;
            if (duration > (delay?.timeRemoveProxySlow ?? 20)) {
                await this.proxyService.updateProxyDie(proxy, 'TIME_OUT')
                return this.getCommentByToken(postId)
            }
            const dataComment = res.data?.data.length > 0 ? res.data?.data[0] : null

            const response = res.data?.data.length ? {
                commentId: btoa(encodeURIComponent(`comment:${dataComment?.id}`)),
                userNameComment: dataComment?.from?.name,
                commentMessage: dataComment?.message,
                phoneNumber: extractPhoneNumber(dataComment?.message),
                userIdComment: dataComment?.from?.id,
                commentCreatedAt: dayjs(dataComment?.created_time).utc().format('YYYY-MM-DD HH:mm:ss')
            } : null

            return {
                hasData: !!res.data?.data,
                data: response
            }
        } catch (error) {
            console.log("🚀 ~ GetCommentPrivateUseCase ~ getCommentPrivate ~ error:", postId, error?.message)
            if (error.response?.data?.error?.code === 100 && (error?.response?.data?.error?.message as string)?.includes('Unsupported get request. Object with ID')) {
                const proxyStatus = await this.checkLinkUseCase.checkLinkStatus(proxy, postId)
                // if (proxyStatus === ICheckLinkStatus.LINK_DIE) {
                //     const links = await this.linkRepository.find({
                //         where: {
                //             postId
                //         }
                //     })
                //     const linksDie = links.map(item => {
                //         return {
                //             ...item,
                //             type: LinkType.DIE
                //         }
                //     })
                //     await this.linkRepository.save(linksDie)
                // }
                if (proxyStatus === ICheckLinkStatus.PROXY_DIE) {
                    await this.proxyService.updateProxyDie(proxy, "TIME_OUT")
                }
            }

            if (error.response?.data?.error?.code === 190) {//check point
                await this.tokenService.updateStatusToken(token, TokenStatus.DIE)
            }
            if ((error?.message as string)?.includes('connect ECONNREFUSED') || error?.status === 407 || (error?.message as string)?.includes('connect EHOSTUNREACH') || (error?.message as string)?.includes('Proxy connection ended before receiving CONNECT')) {
                await this.proxyService.updateProxyDie(proxy)
            }

            if (error?.response?.status == 400) {
                if (error.response?.data?.error?.code === 368) {
                    await this.tokenService.updateStatusToken(token, TokenStatus.LIMIT)
                }
                if (error.response?.data?.error?.code === 190) {
                    await this.tokenService.updateStatusToken(token, TokenStatus.DIE)
                }
                if (error.response?.data?.error?.code === 10) {
                    await this.tokenService.updateStatusToken(token, TokenStatus.DIE)
                }
            }
        }
        return {
            hasData: false,
            data: null
        }
    }

    private async getCommentWithCookie(postId: string, postIdV1?: string) {
        let dataComment = await this.getCommentByCookie(postId)

        if ((!dataComment || !(dataComment as any)?.commentId) && postIdV1) {
            dataComment = await this.getCommentByCookie(postIdV1)
        }

        return dataComment
    }

    async getCommentByCookie(postId: string) {
        let proxy = null
        const cookieEntity = await this.cookieService.getCookieActiveFromDb()
        if (!cookieEntity) return null
        const defaultProxy = this.uniqueCookieProxy.find(item => item.cookieId === cookieEntity.id)
        if (defaultProxy) {
            const isLive = this.proxyService.proxies.some(item => item.id === defaultProxy.proxy.id)
            if (!isLive) { //die
                const newProxy = await this.proxyService.getRandomProxy()
                proxy = newProxy
                defaultProxy.proxy = newProxy
            } else {
                proxy = defaultProxy.proxy
            }
        } else {
            const newProxy = await this.proxyService.getRandomProxy()
            this.uniqueCookieProxy.push({
                cookieId: cookieEntity.id,
                proxy: newProxy
            })
            proxy = newProxy
        }
        if (!proxy) return null
        try {
            const id = `feedback:${postId}`;
            const encodedPostId = Buffer.from(id, 'utf-8').toString('base64');
            const httpsAgent = getHttpAgent(proxy)
            const { facebookId, fbDtsg, jazoest } = await this.getInfoAccountsByCookie(cookieEntity.cookie) || {}

            if (!facebookId) {
                await this.cookieService.updateStatusCookie(cookieEntity, CookieStatus.DIE)

                return null
            }
            const cookies = changeCookiesFb(cookieEntity.cookie)

            const data = {
                av: facebookId,
                __aaid: '0',
                __user: facebookId,
                __a: '1',
                __req: '13',
                __hs: '20209.HYP:comet_pkg.2.1...0',
                dpr: '1',
                __ccg: 'EXCELLENT',
                __rev: '1022417048',
                __s: '5j9f2a:6aicy4:1wsr8e',
                __hsi: '7499382864565808594',
                __dyn: '7xeUmwlEnwn8yEqxemh0no6u5U4e1Nxt3odEc8co2qwJyE24wJwpUe8hw2nVE4W0qa321Rw8G11wBz83WwgEcEhwGwQw9m1YwBgao6C0Mo2swlo5qfK0zEkxe2GewbS2SU4i5oe85nxm16waCm260lCq2-azo3iwPwbS16xi4UdUcobUak0KU566E6C13G1-wkE627E4-8wLwHwea',
                __csr: 'gjMVMFljjPl5OqmDuAXRlAp4L9ZtrQiQb-eypFUB4gyaCiC_xHz9KGDgKboJ2ErBgSvxym5EjyFayVVXUSiEC9Bz-qGDyuu6GgzmaHUmBBDK5GGaUpy8J4CxmcwxUjx20Q87207qA59kRQQ0gd0jA0sHwcW02Jq0c7Q0ME0jNweJ0bqE2Bw28WU0z2E7q0iW6U3yw2kE0p762U03jSwHw7Oo0gfm2C0WFOiw33o9S1mw5Owbq0uW0qWfwJylg35wBw9208qwWo1960dKw6Nw30QU225VHmg905lCabzE3Axmi0Jpk0Uo27xq0P41TzoC0ge0N9o0tyw9Ci3m0Qo2bKjO082hwSwpk2O3K6Q0ruz011a034Yw35w37o1rOwnU460cPw9J2oF3o3Yg1ho3vwnA9yAdDo3mg0zxw26Gxt1G4E3qw4FwjobE0Kq1-xWaQ0g-aOwOw4Hoog1bU0L20oO08Cw',
                __comet_req: '15',
                fb_dtsg: fbDtsg,
                jazoest: jazoest,
                lsd: 'AVrkziLMLUQ',
                __spin_r: '1022417048',
                __spin_b: 'trunk',
                __spin_t: '1746086138',
                __crn: 'comet.fbweb.CometTahoeRoute',
                fb_api_caller_class: 'RelayModern',
                fb_api_req_friendly_name: 'CommentListComponentsRootQuery',
                variables: `{"commentsIntentToken":"RECENT_ACTIVITY_INTENT_V1","feedLocation":"TAHOE","feedbackSource":41,"focusCommentID":null,"scale":1,"useDefaultActor":false,"id":"${encodedPostId}","__relay_internal__pv__IsWorkUserrelayprovider":false}`,
                server_timestamps: 'true',
                doc_id: '9221104427994320'
            };

            const response = await firstValueFrom(
                this.httpService.post("https://www.facebook.com/api/graphql/", new URLSearchParams(data).toString(), {
                    "headers": {
                        "accept": "*/*",
                        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                        "content-type": "application/x-www-form-urlencoded",
                        "priority": "u=1, i",
                        "sec-ch-prefers-color-scheme": "light",
                        "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
                        "sec-ch-ua-full-version-list": "\"Google Chrome\";v=\"135.0.7049.115\", \"Not-A.Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"135.0.7049.115\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-model": "\"\"",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-ch-ua-platform-version": "\"10.0.0\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-asbd-id": "359341",
                        "x-fb-friendly-name": "CommentListComponentsRootQuery",
                        "x-fb-lsd": data.lsd,
                        "cookie": formatCookies(cookies),
                        "Referrer-Policy": "strict-origin-when-cross-origin"
                    },
                    httpsAgent,
                }),
            );

            if (isArray(response.data?.errors) && response.data?.errors[0]?.code === 1675004) {
                await this.cookieService.updateStatusCookie(cookieEntity, CookieStatus.LIMIT)

                return null
            }
            const dataJson = response.data as any

            let dataComment = handleDataComment({
                data: dataJson
            })

            if (!dataComment && typeof response.data === 'string') {
                //story
                const text = response.data
                const lines = text.trim().split('\n');
                const data = JSON.parse(lines[0])
                dataComment = handleDataComment({ data })
            }

            return {
                hasData: true,
                data: dataComment
            }
        } catch (error) {
            console.log("🚀 ~ getCommentByCookie ~ error:", error?.message)
            if ((error?.message as string)?.includes("Maximum number of redirects exceeded")) {
                await this.cookieService.updateStatusCookie(cookieEntity, CookieStatus.LIMIT)
                return null
            }
            if ((error?.message as string)?.includes("Unexpected non-whitespace character after")) {
                await this.cookieService.updateStatusCookie(cookieEntity, CookieStatus.LIMIT)
                return null
            }

            if ((error?.message as string)?.includes("Unexpected token 'o'")) {
                await this.cookieService.updateStatusCookie(cookieEntity, CookieStatus.DIE)
                return null
            }

            return null
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