import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { Not, Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class CommentsService {
  vnTimezone = 'Asia/Bangkok';
  constructor(
    @InjectRepository(CommentEntity)
    private repo: Repository<CommentEntity>,
  ) { }

  findOne(id: number) {
    return this.repo.findOne({
      where: {
        id
      }
    })
  }

  getPhoneNumber(uid: string) {
    return this.repo.findOne({
      where: {
        uid,
        phoneNumber: Not(null)
      }
    })
  }


  getComment(linkId: number, userId: number, cmtId: string) {
    return this.repo.findOne({
      where: {
        linkId,
        userId,
        cmtId
      },
      select: {
        id: true
      }
    })
  }

  getCommentByCmtId(linkId: number, cmtId: string) {
    return this.repo.findOne({
      where: {
        linkId,
        cmtId
      },
      select: {
        id: true
      }
    })
  }
}
