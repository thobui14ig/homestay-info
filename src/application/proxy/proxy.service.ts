import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { delay } from 'src/common/utils/helper';
import { Repository } from 'typeorm';
import { ProxyEntity, ProxyStatus } from './entities/proxy.entity';

@Injectable()
export class ProxyService {
  proxies: ProxyEntity[] = []
  constructor(
    @InjectRepository(ProxyEntity)
    private repo: Repository<ProxyEntity>,
  ) { }

  findOne(id: number) {
    return this.repo.findOne({
      where: {
        id,
      },
    });
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async cronjobRandomProxy() {
    const proxies = await this.repo.find({
      where: {
        status: ProxyStatus.ACTIVE,
        isFbBlock: false
      }
    })

    this.proxies = proxies
  }

  async getRandomProxy() {
    if (this.proxies.length === 0) {
      await delay(5000)
      return this.getRandomProxy()
    }
    const randomIndex = Math.floor(Math.random() * this.proxies?.length);
    const randomProxy = this.proxies[randomIndex];

    return randomProxy
  }

  updateProxyFbBlock(proxy: ProxyEntity) {
    return this.repo.update(proxy.id, { isFbBlock: true });
  }

  updateProxyDie(proxy: ProxyEntity, errorCode?: string) {
    return this.repo.update(proxy.id, { status: ProxyStatus.IN_ACTIVE });
  }

  updateProxyActive(proxy: ProxyEntity) {
    return this.repo.update(proxy.id, { status: ProxyStatus.ACTIVE, isFbBlock: false })
  }

  async updateActiveAllProxy() {
    const allProxy = await this.repo.find({
      where: {
        status: ProxyStatus.IN_ACTIVE
      }
    })
    for (const proxy of allProxy) {
      await this.updateProxyActive(proxy)
    }
  }

  deleteProxyDie() {
    return this.repo.delete({
      status: ProxyStatus.IN_ACTIVE
    })
  }
}
