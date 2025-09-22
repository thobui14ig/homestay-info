import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { ProxyService } from "src/application/proxy/proxy.service";
import { getHttpAgent } from "src/common/utils/helper";
import { IGetInfoFromTiktok } from "./get-info-link-tiktok.i";
import { LinkType } from "src/application/links/entities/links.entity";

@Injectable()
export class GetInfoLinkTiktokUseCase {
    constructor(
        private readonly httpService: HttpService,
        private proxyService: ProxyService
    ) { }

    async execute(postId: string) {
        const proxy = await this.proxyService.getRandomProxy()
        if (!proxy) return null
        const httpsAgent = getHttpAgent(proxy)
        try {
            const response = await firstValueFrom(
                this.httpService.get(`https://www.tiktok.com/oembed?url=https://www.tiktok.com/@chi_diday/video/${postId}?q=h0me%20stay%20hue&t=1758038012990`, {
                    httpsAgent
                })
            )
            const infoFomTiktok = response.data as IGetInfoFromTiktok
            const info = {
                postId: infoFomTiktok.embed_product_id,
                content: infoFomTiktok.title,
                name: infoFomTiktok.author_name,
                type: LinkType.PUBLIC,
            }

            return info
        } catch (error) {
            console.log(error.message)
            return null
        }
    }
}