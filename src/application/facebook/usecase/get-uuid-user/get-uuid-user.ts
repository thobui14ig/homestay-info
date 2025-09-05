import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";
import { getHttpAgent } from "src/common/utils/helper";
import { ProxyService } from "src/application/proxy/proxy.service";
import { TokenStatus } from "src/application/token/entities/token.entity";
import { TokenService } from "src/application/token/token.service";
import { IFacebookUser } from "./get-uuid-user.i";

@Injectable()
export class GetUuidUserUseCase {
    constructor(private readonly httpService: HttpService,
        private proxyService: ProxyService,
        private tokenService: TokenService
    ) {
    }

    async getUuidUserPublic(uuid: string): Promise<string | null> {
        try {
            const proxy = await this.proxyService.getRandomProxy()
            if (!proxy) { return null }
            const httpsAgent = getHttpAgent(proxy)

            const body = {
                route_urls: [`/${uuid}#`],
                routing_namespace: "fb_comet",
                __aaid: "0",
                __user: "0",
                __a: "1",
                __req: "1",
                __hs: "20247.HYP:comet_loggedout_pkg.2.1...0",
                dpr: "1",
                __ccg: "EXCELLENT",
                __rev: "1023615769",
                __s: "vkzw6j:t5vod4:xvht69",
                __hsi: "7513515771275994993",
                __dyn: "7xe6E5q5U5ObwKBAg5S1Dxu13w8CewpUco38w4BwUx609vCwjE1EE2Cw8G1Dw5Zx62G3i0Bo2ygao1aU2swlo6qU2zxe2GewbS2S1uw8W5U4q09yyES0gq0Lo6-3u360hq1Iwqo4q1-w8eEb8uwm85K0UE62",
                __csr: "hQy2kBln8DN5q-QxzpaEOqF7lqhHOFFbFaKbpGBHgx2ZKjGaGSHAxGuWKWQZBGcAyo-ECKEWiElK8gyV4K2eUKEF6yUSum8xh4G5K4K4FEKUKq3auGAKezESfwzG5FoKl2o0Ge1sw62w22E0tCw158U0iSw7nwqUG4k0-U0qaw2lXU1980nMw1WW0HoKaT_U07d2aw1hl09d00whWg1Cz1K07u8pxLg2oqxx3oIbS0chEw790Qwtkeoa61w8ubgSaw9_weW2W0o-1SgCaxe0x5wcu1cw4yK18wd-3O0B80wO4EW0SE7x0iEownU2CwhOw7pyk0ntw6dyAd607Gammh4lz41Vg4Ro2nwtE2mwcO3S0BtaL50horwJw7HUK5E2Pw8K1Bg26zXyWoO2y0wjabzoG5636361BCxVebxRia1-wlU-czpDxS9lw_DAwzzU3Zw5YAwyg1481uEqo5aa82O6o20zo0Sra0wE7e2z59beA8ixr4i9iqwRN27zhwCmag2yx-1BEg2O2S0LU2awpqoGha680q3wge02-Fw4Fw6iw7Dw4-w3DA0-8C5EW0ZU1Co0ZAUiwPgdgSdIg0sy08Awqo7S8BwEogyE0La10w2vU2Tw8t2oG8U4u1gwi8eE13EV5zE0Fe11zoy7y0rElG",
                __hsdp: "g-khhLnQAJpnbPlLmRCO4ycl4j6kg1YAK3JoC0CVe2i5nhfiDzmhli81zwgU2foJ08i8BxMg487m0I81kU4sK1UwkU5y0zo2ow2OUy48Gexu2OazE5G6E29wloG1ewbK2q6VU5e9w8Odw4tw22Ud81382aw6Yw69wfS0iW1hwJw",
                __hblp: "08m0ZBwe-3S0ji0BF82Mw2OU5e1ow4Czo0HS0pa1lwmoty82kwCw5kwem0pq1QwQw4cwEx-11yE5y0ly2O0lO0_o5K8xK1mwyyUfEeF8a8",
                __comet_req: "15",
                lsd: "AVrJ1BmH9yA",
                jazoest: "2878",
                __spin_r: "1023615769",
                __spin_b: "trunk",
                __spin_t: "1749376713",
                __crn: "comet.fbweb.CometProfileLoggedOutRoute"
            };

            const dataUser = await firstValueFrom(
                this.httpService.post(`https://www.facebook.com/ajax/bulk-route-definitions`, body, {
                    headers: {
                        "accept": "*/*",
                        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                        "content-type": "application/x-www-form-urlencoded",
                        "priority": "u=1, i",
                        "sec-ch-prefers-color-scheme": "light",
                        "sec-ch-ua": "\"Google Chrome\";v=\"137\", \"Chromium\";v=\"137\", \"Not/A)Brand\";v=\"24\"",
                        "sec-ch-ua-full-version-list": "\"Google Chrome\";v=\"137.0.7151.69\", \"Chromium\";v=\"137.0.7151.69\", \"Not/A)Brand\";v=\"24.0.0.0\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-model": "\"\"",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-ch-ua-platform-version": "\"10.0.0\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-asbd-id": "359341",
                        "x-fb-lsd": "AVrJ1BmH9yA",
                        "cookie": "sb=IpN2Z63pdgaswLIv6HwTPQe2; ps_l=1; ps_n=1; vpd=v1%3B896x414x2; wl_cbv=v2%3Bclient_version%3A2822%3Btimestamp%3A1748091649; datr=VbQ5aIRhuL3sZgH-YD17GNjn; fr=1fU7tlraJOkrkkxGS.AWdcfYwFDjzjtHDJUoFllEYMCT45XF8X4claPcBn4fPHdvkD0pc.BoRU87..AAA.0.0.BoRVl3.AWd7KNpHjNjmhC8kLOg1f70hmRY; wd=1057x953",
                        "Referrer-Policy": "origin-when-cross-origin"
                    },
                    httpsAgent
                },
                ),
            );
            const html = dataUser.data

            const match = html.match(/"userID"\s*:\s*"(\d+)"/);
            if (match) {
                const userID = match[1];
                return userID
            }

            return null
        } catch (error) {
            console.log("🚀 ~ getUuidPublic ~ error:", error?.message)
            return null
        }
    }

    async getUuidUserToken(uuid: string): Promise<string | null> {
        const proxy = await this.proxyService.getRandomProxy()
        const token = await this.tokenService.getTokenGetInfoActiveFromDb()
        if (!proxy || !token) { return null }
        const httpsAgent = getHttpAgent(proxy)
        const params = {
            "order": "reverse_chronological",
            "limit": "1000",
            "access_token": token.tokenValue,
            "created_time": "created_time"
        }

        try {
            const response: AxiosResponse<IFacebookUser, any> = await firstValueFrom(
                this.httpService.get(`https://graph.facebook.com/${uuid}`, {
                    httpsAgent,
                    params
                }),
            );
            if (response.data.id) {
                return response.data.id
            }

            return null
        } catch (error) {
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
            return null
        }
    }

    async getUuidUser(uuid: string) {
        let uidPublic = await this.getUuidUserPublic(uuid)
        if (uidPublic) return uidPublic
        const uidPrivate = await this.getUuidUserToken(uuid)

        if (uidPrivate) return uidPrivate

        return null
    }
}