import { faker } from '@faker-js/faker';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ProxyEntity } from 'src/application/proxy/entities/proxy.entity';
import { TokenService } from 'src/application/token/token.service';
import { getHttpAgent } from 'src/common/utils/helper';
import { ICheckLinkStatus } from './check-link-status-usecase.i';
import { LinkService } from 'src/application/links/links.service';


@Injectable()
export class CheckLinkUseCase {
    fbUrl = 'https://www.facebook.com';
    fbGraphql = `https://www.facebook.com/api/graphql`;

    constructor(private readonly httpService: HttpService,
        private tokenService: TokenService,
        private linkService: LinkService,
    ) { }


    async checkLinkStatus(proxy: ProxyEntity, postId: string): Promise<ICheckLinkStatus> {
        const token = await this.tokenService.getTokenCrawCmtActiveFromDb()
        const ortherId = (await this.linkService.getLinkOrtherId(postId)).postId
        try {
            if (!proxy || !token) {
                return ICheckLinkStatus.UNDEFINED
            }
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

            const params = {
                "order": "reverse_chronological",
                "limit": "1000",
                "access_token": token.tokenValueV1,
                "created_time": "created_time"
            }


            const res = await firstValueFrom(
                this.httpService.get(`https://graph.facebook.com/${ortherId}/comments`, {
                    headers,
                    httpsAgent,
                    params
                }),
            );

            if (res.data.data) {
                return ICheckLinkStatus.LINK_DIE
            }
            return ICheckLinkStatus.UNDEFINED
        } catch (error) {
            if (error.response?.data?.error?.code === 100 && (error?.response?.data?.error?.message as string)?.includes('Unsupported get request. Object with ID')) {
                return ICheckLinkStatus.PROXY_DIE
            }
            return ICheckLinkStatus.UNDEFINED
        }
    }
}