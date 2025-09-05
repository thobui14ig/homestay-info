import { faker } from '@faker-js/faker';
import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";
import { getHttpAgent } from "src/common/utils/helper";
import { LinkType } from "src/application/links/entities/links.entity";
import { ProxyService } from "src/application/proxy/proxy.service";
import { TokenStatus } from "src/application/token/entities/token.entity";
import { TokenService } from "src/application/token/token.service";
import { IFacebookResponse, IGetInfoLinkResponse } from "./get-info-link.i";


@Injectable()
export class GetInfoLinkUseCase {
    constructor(private readonly httpService: HttpService,
        private tokenService: TokenService,
        private proxyService: ProxyService,
    ) {
    }

    async getInfoLink(postId: string, i = 0, retryCount = 0): Promise<IGetInfoLinkResponse> | null {
        const proxy = await this.proxyService.getRandomProxy()
        const token = await this.tokenService.getTokenGetInfoActiveFromDb()

        if (!proxy || !token) {
            return {
                linkType: LinkType.UNDEFINED
            }
        }

        try {
            const httpsAgent = getHttpAgent(proxy)

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
            const tokenValue = i === 1 ? token.tokenValue : token.tokenValueV1
            const response: AxiosResponse<IFacebookResponse, any> = await firstValueFrom(
                this.httpService.get(`https://graph.facebook.com/${postId}?access_token=${tokenValue}`, {
                    headers,
                    httpsAgent
                }),
            );
            const { name: linkName, id: pageId } = response.data.from || {}
            console.log("🚀 ~ GetInfoLinkUseCase ~ getInfoLink ~ response.data:", response.data)
            const { id, message = null, description = null } = response.data

            return {
                id,
                linkName,
                linkType: LinkType.PUBLIC, //mạc định sẽ là public
                pageId,
                content: message ?? description
            }
        } catch (error) {
            console.log("🚀 ~ GetInfoLinkUseCase ~ getInfoLink ~ error:", error?.message)
            if (error.response?.data?.error?.code === 100 && (error?.response?.data?.error?.message as string)?.includes('Unsupported get request. Object with ID')) {
                return {
                    linkType: LinkType.DIE
                }
            }
            if (error.response?.data?.error?.code === 368) {
                await this.tokenService.updateStatusToken(token, TokenStatus.LIMIT)
            }

            if (error.response?.data?.error?.code === 190) {//check point
                await this.tokenService.updateStatusToken(token, TokenStatus.DIE)
            }
            // if (i === 0 && retryCount === 0) {
            //     i = i + 1

            //     return this.getInfoLink(postId, i)
            // }

            // if (retryCount < 3) {
            //     retryCount = retryCount + 1

            //     return this.getInfoLink(postId, 1, retryCount)
            // }


            return {
                linkType: LinkType.UNDEFINED
            }
        }
    }
}