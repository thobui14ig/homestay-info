import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { firstValueFrom } from "rxjs";
import { RedisService } from "src/infra/redis/redis.service";
import { decodeCommentId, extractPhoneNumber, getHttpAgent, handleDataComment } from "src/common/utils/helper";
import { LinkService } from "src/application/links/links.service";
import { ProxyEntity } from "src/application/proxy/entities/proxy.entity";
import { ProxyService } from "src/application/proxy/proxy.service";
import { getBodyComment, getHeaderComment } from "../../utils";
import { IGetCmtPublicResponse } from "./get-comment-public.i";
import { GetInfoLinkUseCase } from "../get-info-link/get-info-link";
import { LinkEntity, LinkType } from "src/application/links/entities/links.entity";
import { SettingService } from "src/application/setting/setting.service";

dayjs.extend(utc);

@Injectable()
export class GetCommentPublicUseCase {
    fbUrl = 'https://www.facebook.com';
    fbGraphql = `https://www.facebook.com/api/graphql`;

    constructor(private readonly httpService: HttpService,
        private proxyService: ProxyService,
        private linkService: LinkService,
        private redisService: RedisService,
        private getInfoLinkUseCase: GetInfoLinkUseCase,
        private settingService: SettingService,
    ) { }


    async getCmtPublic(postId: string, isCheckInfoLink: boolean = false, link?: LinkEntity): Promise<IGetCmtPublicResponse | null> {
        const postIdString = `feedback:${postId}`;
        const encodedPostId = Buffer.from(postIdString, 'utf-8').toString('base64');

        try {
            const headers = getHeaderComment(this.fbUrl);
            const body = getBodyComment(encodedPostId);
            const proxy = await this.proxyService.getRandomProxy()
            const delay = this.settingService.delay

            if (!proxy) return null
            const httpsAgent = getHttpAgent(proxy)
            const start = Date.now();

            const response = await firstValueFrom(
                this.httpService.post(this.fbGraphql, body, {
                    headers,
                    httpsAgent
                })
            )

            const end = Date.now();
            const duration = (end - start) / 1000;

            if (postId === '1297577275710984') console.log("🚀 ~ GetCommentPublicUseCase ~ getCmtPublic ~ duration:", duration, delay?.timeRemoveProxySlow, proxy?.proxyAddress)
            if (duration > (delay?.timeRemoveProxySlow ?? 20)) {
                await this.proxyService.updateProxyDie(proxy, 'TIME_OUT')
                return this.getCmtPublic(postId)
            }
            if (response.data?.errors?.[0]?.code === 1675004) {
                await this.proxyService.updateProxyFbBlock(proxy)
            }

            if (isCheckInfoLink) {//không phải là link public
                if (!response?.data?.data?.node) {
                    return {
                        hasData: false
                    }
                } else {
                    return {
                        hasData: true,
                    }
                }
            }

            // if (response.data?.data?.node === null && link) {//check link die
            //     // await this.updateLinkDie(link.postId)

            //     return null
            // }

            let dataComment = handleDataComment(response)

            if (!dataComment && typeof response.data === 'string') {
                const text = response.data
                const lines = text.trim().split('\n');
                const data = JSON.parse(lines[0])
                dataComment = handleDataComment({ data })
            }
            // if (postId === '1297577275710984') console.log(dataComment)
            if (dataComment) {
                const key = `${link.id}_${dataComment.commentCreatedAt.replaceAll("-", "").replaceAll(" ", "").replaceAll(":", "")}`
                const isExistKey = await this.redisService.checkAndUpdateKey(key)
                if (!isExistKey) {
                    return {
                        hasData: true,
                        data: dataComment
                    }
                }
            }

            return {
                hasData: true,
                data: null
            }
        } catch (error) {
            return null
        }
    }

    async updateLinkDie(postId: string) {
        const info = await this.getInfoLinkUseCase.getInfoLink(postId)

        if (info.linkType === LinkType.DIE) {
            return this.linkService.updateLinkPostIdInvalid(postId)
        }
    }

}