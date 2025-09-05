import { faker } from '@faker-js/faker';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { LinkEntity } from 'src/application/links/entities/links.entity';
import { ProxyService } from 'src/application/proxy/proxy.service';
import { TokenStatus } from 'src/application/token/entities/token.entity';
import { TokenService } from 'src/application/token/token.service';
import { getHttpAgent } from 'src/common/utils/helper';


@Injectable()
export class GetTotalCountUseCase {
    fbUrl = 'https://www.facebook.com';
    fbGraphql = `https://www.facebook.com/api/graphql`;

    constructor(
        private readonly httpService: HttpService,
        private tokenService: TokenService,
        private proxyService: ProxyService,
    ) { }

    async getTotalCountWithToken(link: LinkEntity) {
        const proxy = await this.proxyService.getRandomProxy()
        const token = await this.tokenService.getTokenCrawCmtActiveFromDb()
        try {

            if (!proxy || !token) { return null }

            const httpsAgent = getHttpAgent(proxy)
            const languages = [
                'en-US,en;q=0.9',
                'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
            ];

            const userAgent = faker.internet.userAgent()
            const apceptLanguage = languages[Math.floor(Math.random() * languages.length)]

            const headers = {
                'authority': 'graph.facebook.com',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="99", "Opera";v="85"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'upgrade-insecure-requests': '1',
                'user-agent': userAgent,
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'sec-fetch-site': 'none',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-user': '?1',
                'sec-fetch-dest': 'document',
                'accept-language': apceptLanguage,
            };
            const id = `${link.pageId}_${link.postId}`

            const dataCommentToken = await firstValueFrom(
                this.httpService.get(`https://graph.facebook.com/${id}?fields=comments.summary(count),reactions.summary(total_count)&access_token=${token.tokenValueV1}`, {
                    headers,
                    httpsAgent
                }),
            );
            const { comments, reactions } = dataCommentToken.data || {}
            const totalCountLike = reactions?.summary?.total_count
            const totalCountCmt = comments?.count

            return {
                totalCountLike, totalCountCmt
            }
        } catch (error) {
            if (error.response?.data?.error?.code === 190) {
                await this.tokenService.updateStatusToken(token, TokenStatus.DIE)
            }
        }
    }

    async getTotalCountPublic(url: string) {
        const proxy = await this.proxyService.getRandomProxy()
        const res = {
            totalCount: null,
            totalLike: null
        }

        try {
            if (!proxy) {
                return res
            }
            const httpsAgent = getHttpAgent(proxy)
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    headers: {
                        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                        "cache-control": "max-age=0",
                        "dpr": "1",
                        "priority": "u=0, i",
                        "sec-ch-prefers-color-scheme": "light",
                        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
                        "sec-ch-ua-full-version-list": "\"Chromium\";v=\"136.0.7103.93\", \"Google Chrome\";v=\"136.0.7103.93\", \"Not.A/Brand\";v=\"99.0.0.0\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-model": "\"\"",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-ch-ua-platform-version": "\"10.0.0\"",
                        "sec-fetch-dest": "document",
                        "sec-fetch-mode": "navigate",
                        "sec-fetch-site": "same-origin",
                        "sec-fetch-user": "?1",
                        "upgrade-insecure-requests": "1",
                        "viewport-width": "856",
                        "cookie": "sb=IpN2Z63pdgaswLIv6HwTPQe2; ps_l=1; ps_n=1; datr=Xr4NaIxUf5ztTudh--LM1AJd; ar_debug=1; fr=1UkVxZvyucxVG78mk.AWevqY9nf_vHWJzPoe3hBWtadWsJ80XJ0HFGnqPtdNh439ijAVg.BoHzIp..AAA.0.0.BoH3O0.AWfmrWmPXac1pUoDOR6Hlr4s3r0; wd=856x953",
                        "Referrer-Policy": "origin-when-cross-origin"
                    },
                    httpsAgent,
                }),
            );

            const htmlContent = response.data
            const matchComment = htmlContent.match(/"reaction_count":\{"count":(\d+),/);
            if (matchComment && matchComment[1]) {
                res.totalCount = matchComment[1]
            }
            if (!res.totalCount) {
                const matchComment = htmlContent.match(/"total_comment_count":(\d+)/);
                if (matchComment && matchComment[1]) {
                    res.totalCount = matchComment[1]
                }
            }


            const matchLike = htmlContent.match(/"total_count":(\d+)/);
            if (matchLike && matchLike[1]) {
                res.totalLike = matchLike[1]
            }
            if (!res.totalLike) {
                const matchLike2 = htmlContent.match(/"likers":\{"count":(\d+)}/);
                if (matchLike2 && matchLike2[1]) {
                    res.totalLike = matchLike2[1]
                }
            }
            return res
        } catch (error) {
            if ((error?.message as string)?.includes('connect ECONNREFUSED') || error?.status === 407 || (error?.message as string)?.includes('connect EHOSTUNREACH') || (error?.message as string)?.includes('Proxy connection ended before receiving CONNECT')) {
                await this.proxyService.updateProxyDie(proxy)
            }

            return res
        }
    }
}