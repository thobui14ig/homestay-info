import { Controller, Get } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) { }

  @Get('/get-proxy-active')
  getProxyActive() {
    return this.proxyService.getRandomProxy()
  }
}
