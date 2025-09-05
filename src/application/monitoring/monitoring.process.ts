
import { KEY_PROCESS_QUEUE } from './monitoring.service.i';
import { Process, Processor } from '@nestjs/bull';
import { FB_UUID, ICommentResponse } from '../facebook/facebook.service.i';
import { LinkEntity } from '../links/entities/links.entity';
import { SettingService } from '../setting/setting.service';
import { CommentsService } from '../comments/comments.service';
import { isNumeric } from 'src/common/utils/check-utils';
import { FacebookService } from '../facebook/facebook.service';
import { GetUuidUserUseCase } from '../facebook/usecase/get-uuid-user/get-uuid-user';
import { CommentEntity } from '../comments/entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { Job } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

dayjs.extend(utc);

interface CmtWaitProcess {
    userUid: string,
    commentId: string,
    linkId: number
}
@Processor(KEY_PROCESS_QUEUE.ADD_COMMENT)
export class MonitoringConsumer {
    listCmtWaitProcess: CmtWaitProcess[] = []
    constructor(
        private settingService: SettingService,
        private commentService: CommentsService,
        private readonly facebookService: FacebookService,
        private getUuidUserUseCase: GetUuidUserUseCase,
        @InjectRepository(CommentEntity)
        private commentRepository: Repository<CommentEntity>,
        @InjectRepository(LinkEntity)
        private linkRepository: Repository<LinkEntity>,
        private readonly httpService: HttpService,
    ) {

    }
    @Process({
        name: 'transcode',
        concurrency: 10
    })
    async process(job: Job<{ resComment: ICommentResponse, link: LinkEntity }>): Promise<any> {
        const { link, resComment } = job.data
        return this.run(link, resComment)
    }

    async run(link, resComment) {
        try {
            const {
                commentId,
                commentMessage,
                phoneNumber,
                userIdComment,
                userNameComment,
                commentCreatedAt,
            } = resComment || {}
            if (!resComment?.commentId || !resComment?.userIdComment) return

            let isSave = await this.checkIsSave(commentMessage)
            if (isSave) {
                const comment = await this.commentService.getComment(link.id, link.userId, commentId)
                if (!comment) {
                    const uid = (isNumeric(userIdComment) ? userIdComment : (await this.getUuidUserUseCase.getUuidUser(userIdComment)) || userIdComment)
                    let newPhoneNumber = await this.handlePhoneNumber(phoneNumber, uid, commentId, "Beewisaka@gmail.com")// mặc định sẽ call qua Beewisaka@gmail.com
                    if (!newPhoneNumber && link.user?.accountFbUuid == "chuongk57@gmail.com") {
                        this.listCmtWaitProcess.push({
                            commentId,
                            userUid: uid,
                            linkId: link.id
                        })
                    }

                    const commentEntity: Partial<CommentEntity> = {
                        cmtId: commentId,
                        linkId: link.id,
                        postId: link.postId,
                        userId: link.userId,
                        uid,
                        message: commentMessage,
                        phoneNumber: newPhoneNumber,
                        name: userNameComment,
                        timeCreated: commentCreatedAt as any,
                    }
                    const time = !link.lastCommentTime as any || dayjs(commentCreatedAt).isAfter(dayjs(link.lastCommentTime)) as any ? commentCreatedAt : link.lastCommentTime as any
                    const linkEntity: Partial<LinkEntity> = { id: link.id, lastCommentTime: time, timeCrawUpdate: time }
                    await Promise.all([this.commentRepository.save(commentEntity), this.linkRepository.save(linkEntity)])
                }
            }
        } catch (error) { }
    }

    async checkIsSave(commentMessage: string) {
        let isSave = true;

        const keywords = await this.settingService.getKeywordsAdmin()
        for (const keyword of keywords) {
            if (commentMessage.includes(keyword.keyword)) {
                isSave = false;
                break;
            }
        }

        return isSave
    }

    async handlePhoneNumber(phoneNumber: string, uid: string, commentId: string, accountFbUuid: string) {
        let newPhoneNumber = phoneNumber
        if (newPhoneNumber) {
            try {
                this.facebookService.addPhone(uid, newPhoneNumber)
            } catch (error) { }
        } else {
            try {
                newPhoneNumber = await this.facebookService.getPhoneNumber(uid, commentId, accountFbUuid)
            } catch (error) { }
        }

        return newPhoneNumber
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async processGetPhoneNumberVip() {
        if (this.listCmtWaitProcess.length < 20) return
        const listCmtWaitProcessClone = [...this.listCmtWaitProcess]
        this.listCmtWaitProcess = []

        const batchSize = 20;
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
            const response = await firstValueFrom(
                this.httpService.post("https://api.fbuid.com/keys/convert", body,),
            );
            if (response.data.length <= 0) continue
            for (const element of batch) {
                const phone = response.data?.find(item => item.uid == element.userUid)

                if (!phone) continue
                const cmt = await this.commentService.getCommentByCmtId(element.linkId, element.commentId)
                if (!cmt) continue;
                await this.commentRepository.save({
                    id: cmt.id,
                    phoneNumber: phone.phone
                })
            }
        }
    }
}
