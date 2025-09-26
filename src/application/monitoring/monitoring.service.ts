import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { firstValueFrom } from 'rxjs';
import { getHttpAgent } from 'src/common/utils/helper';
import { RedisService } from 'src/infra/redis/redis.service';
import { DataSource, Repository } from 'typeorm';
import { CommentsService } from '../comments/comments.service';
import { CommentEntity } from '../comments/entities/comment.entity';
import { CookieService } from '../cookie/cookie.service';
import { FacebookService } from '../facebook/facebook.service';
import {
  LinkEntity,
  LinkStatus,
  LinkType
} from '../links/entities/links.entity';
import { LinkService } from '../links/links.service';
import { ProxyEntity } from '../proxy/entities/proxy.entity';
import { ProxyService } from '../proxy/proxy.service';
import { DelayEntity } from '../setting/entities/delay.entity';
import { TokenService } from '../token/token.service';
import { MonitoringConsumer } from './monitoring.process';
import { FB_UUID, KEY_PROCESS_QUEUE } from './monitoring.service.i';
const proxy_check = require('proxy-check');

dayjs.extend(utc);

type RefreshKey = 'refreshToken' | 'refreshCookie' | 'refreshProxy';
@Injectable()
export class MonitoringService implements OnModuleInit {
  postIdRunning: string[] = []
  // linksPublic: LinkEntity[] = []
  linksPrivate: LinkEntity[] = []
  isHandleUrl: boolean = false
  isReHandleUrl: boolean = false
  isHandleUuid: boolean = false
  isCheckProxy: boolean = false
  isUpdatePostIdV1: boolean = false
  isUpdatePrivatePostIdV1: boolean = false
  private jobIntervalHandlers: Record<RefreshKey, NodeJS.Timeout> = {
    refreshToken: null,
    refreshCookie: null,
    refreshProxy: null,
  };

  private currentRefreshMs: Record<RefreshKey, number> = {
    refreshToken: 0,
    refreshCookie: 0,
    refreshProxy: 0,
  };

  constructor(
    @InjectRepository(LinkEntity)
    private linkRepository: Repository<LinkEntity>,
    private readonly facebookService: FacebookService,
    @InjectRepository(ProxyEntity)
    private proxyRepository: Repository<ProxyEntity>,
    @InjectRepository(DelayEntity)
    private delayRepository: Repository<DelayEntity>,
    private proxyService: ProxyService,
    private linkService: LinkService,
    private tokenService: TokenService,
    private cookieService: CookieService,
    private redisService: RedisService,
    private connection: DataSource,
    @InjectQueue(KEY_PROCESS_QUEUE.ADD_COMMENT) private monitoringQueue: Queue,
    private consumer: MonitoringConsumer,
    private readonly httpService: HttpService,
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
    private commentService: CommentsService,
  ) {
  }

  async onModuleInit() {
    // Bắt đầu kiểm tra định kỳ từng loại
    ['refreshToken', 'refreshCookie', 'refreshProxy', 'delayCommentCount'].forEach((key: RefreshKey) => {
      setInterval(() => this.checkAndUpdateScheduler(key), 10 * 1000);
      this.checkAndUpdateScheduler(key); // gọi ngay lúc khởi động
    });
  }

  private async checkAndUpdateScheduler(key: RefreshKey) {
    const config = await this.delayRepository.find();
    if (!config.length) return;
    const newRefreshMs = (config[0][key] ?? 60) * 60 * 1000;

    if (newRefreshMs !== this.currentRefreshMs[key]) {
      this.currentRefreshMs[key] = newRefreshMs;

      if (this.jobIntervalHandlers[key]) {
        clearInterval(this.jobIntervalHandlers[key]);
      }

      this.jobIntervalHandlers[key] = setInterval(() => {
        this.doScheduledJob(key);
      }, newRefreshMs);

      console.log(`🔄 Đặt lại job "${key}" mỗi ${newRefreshMs / 1000}s`);
    }
  }

  private async doScheduledJob(key: RefreshKey) {
    if (key === "refreshToken") {
      return this.tokenService.updateActiveAllToken()
    }
    if (key === "refreshCookie") {
      return this.cookieService.updateActiveAllCookie()
    }
    if (key === "refreshProxy") {
      return this.proxyService.updateActiveAllProxy()
    }

  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  SLAVEOF() {
    return this.redisService.SLAVEOF()
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async cronjobHandleProfileUrl() {
    if (this.isHandleUrl) {
      return
    }

    const links = await this.linkService.getLinksWithoutProfile()
    console.log('link handle: ', links.length)
    if (links.length === 0) {
      this.isHandleUrl = false
      return
    };

    this.isHandleUrl = true
    for (const link of links) {
      try {
        const { type, name, postId, pageId, content } = await this.facebookService.getProfileLink(link.linkUrl, link.crawType) || {} as any;
        if (postId) {
          const exitLink = await this.linkRepository.findOne({
            where: {
              postId,
              userId: link.userId
            }
          });
          if (exitLink) {
            await this.linkRepository.delete(link.id);
            continue;
          }
        }

        if (!link.linkName || link.linkName.length === 0) {
          link.linkName = name;
        }

        link.process = type === LinkType.UNDEFINED ? false : true;
        link.type = type;
        link.postId = postId;
        link.pageId = pageId
        link.content = content;

        if (type !== LinkType.UNDEFINED) {
          const delayTime = await this.getDelayTime(link.status, type, link.user.delayOnPrivate, link.user.delayOnPublic)
          link.delayTime = delayTime
        }

        if (postId) {
          link.postIdV1 =
            type === LinkType.PUBLIC
              ? await this.facebookService.getPostIdPublicV1(link.linkUrl)
              : null;
        }


        await this.linkRepository.save(link);
      } catch (error) {
        console.log("🚀 ~ MonitoringService ~ cronjobHandleProfileUrl ~ error:", error)

      }
    }

    this.isHandleUrl = false
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkProxy() {
    if (this.isCheckProxy) return

    this.isCheckProxy = true
    const proxyInActive = await this.proxyRepository.find()

    for (const proxy of proxyInActive) {
      const [host, port, username, password] = proxy.proxyAddress.split(':');
      const config = {
        host,
        port,
        proxyAuth: `${username}:${password}`
      };
      proxy_check(config).then(async (res) => {
        console.log(res)

        if (res) {
          const status = await this.facebookService.checkProxyBlock(proxy)
          console.log(status)
          if (!status) {
            await this.proxyService.updateProxyActive(proxy)
          } else {
            await this.proxyService.updateProxyFbBlock(proxy)
          }
        }
      }).catch(async (e) => {
        await this.proxyService.updateProxyDie(proxy)
      });
    }
    this.isCheckProxy = false
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async updatePublicPostIdV1() {
    if (this.isUpdatePostIdV1) return
    this.isUpdatePostIdV1 = true
    const links = await this.linkService.getAllLinkPublicPostIdV1Null()

    for (const link of links) {
      try {
        const id = await this.facebookService.getPostIdPublicV1(link.linkUrl)
        if (id) {
          await this.linkRepository.update(link.id, { postIdV1: id })
          // this.linksPublic = this.linksPublic.filter(item => item.id === link.id)
        }
      } catch (error) { }
    }
    this.isUpdatePostIdV1 = false
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async updatePrivatePostIdV1() {
    if (this.isUpdatePrivatePostIdV1) return
    this.isUpdatePrivatePostIdV1 = true
    const links = await this.linkService.getAllLinkPrivatePostIdV1Null()
    for (const link of links) {
      try {
        const id = await this.facebookService.getPostIdPrivateV1(link.linkUrl)
        if (id) {
          await this.linkRepository.update(link.id, { postIdV1: id })
          // this.linksPublic = this.linksPublic.filter(item => item.id === link.id)
        }
      } catch (error) { }
    }
    this.isUpdatePrivatePostIdV1 = false
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  removeDupRow() {
    return this.connection.query(`
      WITH ranked AS (
          SELECT *,
                ROW_NUMBER() OVER (PARTITION BY post_id, cmtid, link_id ORDER BY post_id) AS rn
          FROM comments
        )

        DELETE FROM comments
        WHERE (post_id, cmtid, link_id, id) IN (
          SELECT post_id, cmtid, link_id, id
          FROM ranked
          WHERE rn > 1
        )
      `)
  }


  async getDelayTime(status: LinkStatus, type: LinkType, delayOnPrivateUser: number, delayOnPublic: number) {
    const setting = await this.delayRepository.find()

    if (status === LinkStatus.Started && type === LinkType.PRIVATE) {
      return delayOnPrivateUser
    }

    if (status === LinkStatus.Pending && type === LinkType.PRIVATE) {
      return setting[0].delayOffPrivate
    }

    if (status === LinkStatus.Started && type === LinkType.PUBLIC) {
      return delayOnPublic
    }

    if (status === LinkStatus.Pending && type === LinkType.PUBLIC) {
      return setting[0].delayOff
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processGetPhoneNumberVip() {
    const listCmtWaitProcessClone = await this.getListDataProcessPhone() ?? []
    if (listCmtWaitProcessClone.length < 5) return

    const batchSize = 5;
    for (let i = 0; i < listCmtWaitProcessClone.length; i += batchSize) {
      const batch = listCmtWaitProcessClone.slice(i, i + batchSize);
      const account = FB_UUID.find(item => item.mail === "chuongk57@gmail.com")
      if (!account) continue;
      const uids = batch.map((item) => {
        return String(item.userUid)
      })
      const body = {
        key: account.key,
        uids: [...uids]
      }
      const proxy = await this.proxyService.getRandomProxy()
      if (!proxy) break;
      const httpsAgent = getHttpAgent(proxy)
      const response = await firstValueFrom(
        this.httpService.post("https://api.fbuid.com/keys/convert", body, { httpsAgent }),
      );
      const logs = {
        body,
        response: response.data
      }
      await this.insertLogs(JSON.stringify(uids), JSON.stringify(batch), JSON.stringify(logs))

      if (response.data.length <= 0) continue
      for (const element of batch) {
        const phone = response?.data?.find(item => item.uid == element.userUid)
        await this.deleteCmtWaitProcess(element.id)

        if (!phone || phone?.phone?.length == 0) continue
        const cmt = await this.commentService.getCommentByCmtId(element.linkId, element.commentId)
        if (!cmt) continue;
        await this.commentRepository.save({
          id: cmt.id,
          phoneNumber: phone.phone
        })
      }
    }
  }

  getListDataProcessPhone() {
    return this.connection.query(`
        SELECT user_uid as userUid, comment_id as commentId, link_id as linkId, id
        FROM cmt_wait_process
        ORDER BY created_at ASC
    `)
  }

  deleteCmtWaitProcess(id: number) {
    return this.connection.query(`
      delete from cmt_wait_process where id= ${id}
    `)
  }

  insertLogs(UID: string, commentId: string, params: string) {
    return this.connection.query(`
      INSERT INTO logs (uid, cmt_id, params)
      VALUES ('${UID}', '${commentId}', '${params}');  
    `)
  }
}
