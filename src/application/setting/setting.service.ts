import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DelayEntity } from './entities/delay.entity';
import { KeywordEntity } from './entities/keyword';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SettingService {
  delay: DelayEntity = null
  constructor(
    @InjectRepository(KeywordEntity)
    private keywordRepository: Repository<KeywordEntity>,
    @InjectRepository(DelayEntity)
    private delayRepository: Repository<DelayEntity>,
  ) {
    this.cronjobRandomProxy()
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async cronjobRandomProxy() {
    const delayRes = await this.delayRepository.find()

    this.delay = delayRes[0]
  }

  getKeywords(userId: number) {
    return this.keywordRepository.find({
      where: {
        userId
      }
    })
  }

  async getDelay() {
    const response = await this.delayRepository.find()
    return (response.length === 0 ? null : response[0])
  }

  removeAllKeyword() {
    return this.keywordRepository.delete({})
  }

  getKeywordsAdmin() {
    return this.keywordRepository.find({
      where: {
        linkId: IsNull()
      }
    })
  }
}
