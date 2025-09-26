import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { ProxyEntity } from "src/application/proxy/entities/proxy.entity";
import { getHttpAgent } from "src/common/utils/helper";

@Injectable()
export class CheckProxyBlockUseCase {
    fbUrl = 'https://www.facebook.com';
    fbGraphql = `https://www.facebook.com/api/graphql`;

    constructor(
        private readonly httpService: HttpService,
    ) { }

    async execute(proxy: ProxyEntity) {
        try {
            const httpsAgent = getHttpAgent(proxy)

            const response = await firstValueFrom(
                this.httpService.get("https://www.facebook.com/630629966359111", {
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
            const isBlockProxy = (htmlContent as string).includes('Temporarily Blocked')

            if (isBlockProxy) {
                return true
            }

            const isCookieDie = (htmlContent as string).includes('You must log in to continue')
            if (isCookieDie) {
                return true
            }

            return false
        } catch (error) {
            return false
        }
    }
}