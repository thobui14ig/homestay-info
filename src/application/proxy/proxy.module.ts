import { Module } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { ProxyEntity } from './entities/proxy.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProxyController } from './proxy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProxyEntity])],
  exports: [ProxyService],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule { }
