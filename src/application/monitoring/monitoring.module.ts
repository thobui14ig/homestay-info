import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from '../comments/entities/comment.entity';
import { CookieEntity } from '../cookie/entities/cookie.entity';
import { FacebookModule } from '../facebook/facebook.module';
import { GetCommentPublicUseCaseModule } from '../facebook/usecase/get-comment-public/get-comment-public.module';
import { GetUuidUserUseCaseModule } from '../facebook/usecase/get-uuid-user/get-uuid-user.module';
import { HideCommentUseCaseModule } from '../facebook/usecase/hide-comment/hide-comment.module';
import { LinkEntity } from '../links/entities/links.entity';
import { ProxyEntity } from '../proxy/entities/proxy.entity';
import { DelayEntity } from '../setting/entities/delay.entity';
import { SettingModule } from '../setting/setting.module';
import { TokenEntity } from '../token/entities/token.entity';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { ProxyModule } from '../proxy/proxy.module';
import { LinkModule } from '../links/links.module';
import { TokenModule } from '../token/token.module';
import { CommentsModule } from '../comments/comments.module';
import { CookieModule } from '../cookie/cookie.module';
import { UserEntity } from '../user/entities/user.entity';
import { KEY_PROCESS_QUEUE } from './monitoring.service.i';
import { BullModule } from '@nestjs/bull';
import { MonitoringConsumer } from './monitoring.process';

@Module({
  imports: [
    TypeOrmModule.forFeature([LinkEntity, CommentEntity, TokenEntity, CookieEntity, ProxyEntity, DelayEntity, UserEntity]),
    FacebookModule, HttpModule, GetCommentPublicUseCaseModule, HideCommentUseCaseModule, GetUuidUserUseCaseModule, SettingModule, ProxyModule, LinkModule, TokenModule, CommentsModule, CookieModule,
    BullModule.registerQueue({
      name: KEY_PROCESS_QUEUE.ADD_COMMENT,
    })
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService, MonitoringConsumer],
  exports: [MonitoringService],
})
export class MonitoringModule { }
