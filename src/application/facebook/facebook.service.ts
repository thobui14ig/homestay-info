import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosRequestConfig } from 'axios';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { firstValueFrom } from 'rxjs';
import { isNumeric } from 'src/common/utils/check-utils';
import { changeCookiesFb, extractFacebookId, formatCookies, getHttpAgent } from 'src/common/utils/helper';
import { DataSource, Repository } from 'typeorm';
import { CommentsService } from '../comments/comments.service';
import { CommentEntity } from '../comments/entities/comment.entity';
import { CrawType, LinkEntity, LinkType } from '../links/entities/links.entity';
import { ProxyEntity } from '../proxy/entities/proxy.entity';
import { ProxyService } from '../proxy/proxy.service';
import { TokenType } from '../token/entities/token.entity';
import { FB_UUID } from './facebook.service.i';
import { CheckProxyBlockUseCase } from './usecase/check-proxy-block/check-proxy-block-usecase';
import { GetCommentPrivateUseCase } from './usecase/get-comment-private/get-comment-private';
import { GetCommentPublicUseCase } from './usecase/get-comment-public/get-comment-public';
import { GetInfoLinkUseCase } from './usecase/get-info-link/get-info-link';
import { GetTotalCountUseCase } from './usecase/get-total-count/get-total-count-usecase';
import { GetUuidUserUseCase } from './usecase/get-uuid-user/get-uuid-user';
import { HideCommentUseCase } from './usecase/hide-comment/hide-comment';
import {
  getBodyToken,
  getHeaderProfileFb,
  getHeaderToken
} from './utils';
import { CookieService } from '../cookie/cookie.service';
import { GetInfoLinkTiktokUseCase } from './usecase/get-info-link-tiktok/get-info-link-tiktok';

dayjs.extend(utc);
// dayjs.extend(timezone);

@Injectable()
export class FacebookService {
  // appId = '256002347743983';
  appId = '6628568379'
  fbUrl = 'https://www.facebook.com';
  fbGraphql = `https://www.facebook.com/api/graphql`;
  ukTimezone = 'Asia/Bangkok';
  browser = null

  constructor(private readonly httpService: HttpService,
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
    private getInfoLinkUseCase: GetInfoLinkUseCase,
    private getCommentPublicUseCase: GetCommentPublicUseCase,
    private getCommentPrivateUseCase: GetCommentPrivateUseCase,
    private getUuidUserUseCase: GetUuidUserUseCase,
    private hideCommentUseCase: HideCommentUseCase,
    private getTotalCountUseCase: GetTotalCountUseCase,
    private CheckProxyBlockUseCase: CheckProxyBlockUseCase,
    private commentsService: CommentsService,
    private proxyService: ProxyService,
    private cookieService: CookieService,
    private getInfoLinkTiktokUseCase: GetInfoLinkTiktokUseCase,
    private connection: DataSource
  ) {
  }

  getAppIdByTypeToken(type: TokenType) {
    if (type === TokenType.EAADo1) {
      return '256002347743983'
    }

    if (type === TokenType.EAAAAAY) {
      return '6628568379'
    }

    return '256002347743983'
  }

  async getDataProfileFb(
    cookie: string,
    type: TokenType
  ): Promise<{ login: boolean; accessToken?: string }> {
    const cookies = changeCookiesFb(cookie);
    const headers = getHeaderProfileFb();
    const config: AxiosRequestConfig = {
      headers,
      withCredentials: true,
      timeout: 30000,
    };
    const appId = this.getAppIdByTypeToken(type)

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.fbUrl, {
          ...config,
          headers: { ...config.headers, Cookie: formatCookies(cookies) },
        }),
      );

      const responseText: string = response.data as string;
      const idUserMatch = responseText.match(/"USER_ID":"([^"]*)"/);
      const idUser = idUserMatch ? idUserMatch[1] : null;
      if (idUser === '0') {
        return { login: false };
      }

      const fbDtsgMatch = responseText.match(/"f":"([^"]*)","l/);
      const fbDtsg = fbDtsgMatch ? fbDtsgMatch[1] : null;

      const cleanedText = responseText?.replace(/\[\]/g, '');
      const match = cleanedText.match(/LSD",,{"token":"(.+?)"/);

      const lsd = match ? match[1] : null;
      const cUser = cookies['c_user'];
      const accessToken = await this.getToken(
        fbDtsg,
        lsd,
        cookies,
        cUser,
        appId,
      );

      return { login: true, accessToken: accessToken };
    } catch (error) {
      console.log("🚀 ~ error:", error?.message)
      return { login: false };
    }
  }

  private async getToken(
    fbDtsg: string,
    lsd: string,
    cookies: Record<string, string>,
    cUser: string,
    appId: string,
  ) {
    const headers = getHeaderToken(this.fbUrl);
    const body = getBodyToken(cUser, fbDtsg, appId);
    const config: AxiosRequestConfig = {
      headers,
      withCredentials: true,
      timeout: 30000,
    };

    const response = await firstValueFrom(
      this.httpService.post(this.fbGraphql, body, {
        ...config,
        headers: { ...config.headers, Cookie: formatCookies(cookies) },
      }),
    );

    const uri = response.data?.data?.run_post_flow_action?.uri;
    if (!uri) return null;

    const parsedUrl = new URL(uri as string);
    const closeUri = parsedUrl.searchParams.get('close_uri');
    if (!closeUri) return null;

    const decodedCloseUri = decodeURIComponent(closeUri);
    const fragment = new URL(decodedCloseUri).hash.substring(1); // remove the '#'
    const fragmentParams = new URLSearchParams(fragment);

    const accessToken = fragmentParams.get('access_token');
    return accessToken ?? null;
  }

  async getCmtPublic(postIdStr: string, link: LinkEntity) {
    const commentsRes = await this.getCommentPublicUseCase.getCmtPublic(postIdStr, false, link)
    if (!commentsRes) {//hết proxy or token
      return null
    }

    return commentsRes.data
  }

  async getCommentByToken(postId: string, postIdV1?: string) {
    const commentsRes = await this.getCommentPrivateUseCase.getCommentPrivate(postId, postIdV1)
    if (!commentsRes) {//hết proxy or token
      return null
    }

    return commentsRes.data
  }

  async getProfileLink(url: string, crawType: CrawType) {
    console.log(url)
    if (crawType === CrawType.FACEBOOK) {
      let postId = null
      if (url.includes("share")) {
        console.log(2)
        const postIdBefore = await this.getPostIdPublicV1Before(url)
        console.log(333, postIdBefore)
        if (postIdBefore) {
          postId = postIdBefore
        }
      } else {
        postId = extractFacebookId(url);

      }

      if (!postId) {
        return {
          type: LinkType.UNDEFINED
        }
      }
      const info = await this.getInfoLinkUseCase.getInfoLink(postId);

      if (!info?.id) {
        return { type: info?.linkType ?? LinkType.UNDEFINED };
      }

      const cmtResponse = await this.getCommentPublicUseCase.getCmtPublic(info.id, true);
      if (!cmtResponse) return { type: LinkType.UNDEFINED };

      const baseInfo = {
        name: info.linkName,
        postId: info.id,
        content: info.content
      };

      if (cmtResponse.hasData) {
        return {
          type: LinkType.PUBLIC,
          ...baseInfo,
        };
      }

      return {
        type: LinkType.PRIVATE,
        ...baseInfo,
        pageId: info.pageId,
      };
    } else {
      const res = await this.getInfoLinkTiktokUseCase.execute(url)
      if (!res?.postId) {
        return { type: res?.type ?? LinkType.UNDEFINED };
      }

      return res
    }
  }

  async getCountLikePublic(url: string) {
    return this.getTotalCountUseCase.getTotalCountPublic(url)
  }

  async checkProxyBlock(proxy: ProxyEntity) {
    return this.CheckProxyBlockUseCase.execute(proxy)
  }

  async getPostIdPublicV1(url: string) {
    try {
      const proxy = await this.proxyService.getRandomProxy()
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
            "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
            "sec-ch-ua-full-version-list": "\"Google Chrome\";v=\"135.0.7049.116\", \"Not-A.Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"135.0.7049.116\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-model": "\"\"",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-ch-ua-platform-version": "\"10.0.0\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "viewport-width": "856"
          },
          httpsAgent,
        }),
      );
      const htmlContent = response.data
      const match = htmlContent.match(/"subscription_target_id":"(.*?)"/);
      if (match && match[1]) {
        const postId = match[1]
        if (postId) {
          return postId
        }
      }

      const matchV1 = htmlContent.match(/"post_id":"(.*?)"/);

      if (matchV1 && matchV1[1]) {
        const postId = matchV1[1]
        if (postId) {
          return postId
        }
      }

      return null
    } catch (error) {
      return null
    }
  }


  async getPostIdPublicV1Before(url: string) {
    try {
      // const proxy = await this.proxyService.getRandomProxy()
      // const httpsAgent = getHttpAgent(proxy)
      console.log(44444)
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            "cache-control": "max-age=0",
            "dpr": "1",
            "priority": "u=0, i",
            "sec-ch-prefers-color-scheme": "light",
            "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
            "sec-ch-ua-full-version-list": "\"Google Chrome\";v=\"135.0.7049.116\", \"Not-A.Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"135.0.7049.116\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-model": "\"\"",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-ch-ua-platform-version": "\"10.0.0\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "viewport-width": "856"
          },
          // httpsAgent,
        }),
      );
      console.log(5555)

      const htmlContent = response.data
      const matchV1 = htmlContent.match(/"post_id":"(.*?)"/);

      if (matchV1 && matchV1[1]) {
        const postId = matchV1[1]
        if (postId) {
          return postId
        }
      }

      return null
    } catch (error) {
      console.log(error)
      return null
    }
  }
  async getPostIdPrivateV1(url: string) {
    try {
      const proxy = await this.proxyService.getRandomProxy()
      const httpsAgent = getHttpAgent(proxy)
      const cookie = await this.cookieService.getCookieActiveFromDb()
      if (!cookie) return null
      const cookies = changeCookiesFb(cookie.cookie)
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            "cache-control": "max-age=0",
            "dpr": "1",
            "priority": "u=0, i",
            "sec-ch-prefers-color-scheme": "light",
            "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
            "sec-ch-ua-full-version-list": "\"Google Chrome\";v=\"135.0.7049.116\", \"Not-A.Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"135.0.7049.116\"",
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
            "cookie": formatCookies(cookies),
          },
          httpsAgent,
        }),
      );
      const htmlContent = response.data
      const match = htmlContent.match(/"subscription_target_id":"(.*?)"/);
      if (match && match[1]) {
        const postId = match[1]
        if (postId) {
          return postId
        }
      }

      const matchV1 = htmlContent.match(/"post_id":"(.*?)"/);

      if (matchV1 && matchV1[1]) {
        const postId = matchV1[1]
        if (postId) {
          return postId
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  async getTotalCountWithToken(link: LinkEntity) {
    return this.getTotalCountUseCase.getTotalCountWithToken(link)
  }

  async updateUUIDUser() {
    const comments = await this.commentRepository.createQueryBuilder('comment')
      .where('comment.uid LIKE :like1', { like1: 'Y29tb%' })
      .orWhere('comment.uid LIKE :like2', { like2: '%pfbid%' })
      .getMany();

    if (!comments.length) return

    for (const comment of comments) {
      let uid = await this.getUuidUserUseCase.getUuidUser(comment.uid)

      if (uid) {
        comment.uid = uid
        await this.commentRepository.save(comment)
      }
    }
  }

  async getPhoneNumber(uid: string, commentId: string, accountFbUuid: string) {
    if (!isNumeric(uid)) return null
    const dataPhoneDb = await this.commentsService.getPhoneNumber(uid)
    if (dataPhoneDb?.phoneNumber) return dataPhoneDb.phoneNumber
    const account = FB_UUID.find(item => item.mail === accountFbUuid)
    if (!account) return null
    const body = {
      key: account.key,
      uids: [String(uid)]
    }
    const response = await firstValueFrom(
      this.httpService.post("https://api.fbuid.com/keys/convert", body,),
    );
    const dataPhone = response.data?.find(item => item.uid == uid)
    const logs = {
      body,
      response: response.data
    }
    await this.insertLogs(uid, commentId, JSON.stringify(logs))

    return dataPhone?.phone ?? null
  }

  async addPhone(UID: string, Phone: string) {
    try {
      const body = {
        UID,
        Phone
      }
      return await firstValueFrom(
        this.httpService.post("https://api.fbuid.com/conversions/import", body,),
      );
    } catch (error) { }
  }

  insertLogs(UID: string, commentId: string, params: string) {
    return this.connection.query(`
      INSERT INTO logs (uid, cmt_id, params)
      VALUES ('${UID}', '${commentId}', '${params}');  
    `)
  }
}
