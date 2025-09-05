import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from '../token/entities/token.entity';
import { FacebookService } from './facebook.service';
import { CookieEntity } from '../cookie/entities/cookie.entity';
import { ProxyEntity } from '../proxy/entities/proxy.entity';
import { LinkEntity } from '../links/entities/links.entity';
import { CommentEntity } from '../comments/entities/comment.entity';
import { DelayEntity } from '../setting/entities/delay.entity';
import { GetInfoLinkUseCaseModule } from './usecase/get-info-link/get-info-link-usecase.module';
import { GetCommentPublicUseCaseModule } from './usecase/get-comment-public/get-comment-public.module';
import { GetCommentPrivateUseCaseModule } from './usecase/get-comment-private/get-comment-private.module';
import { GetUuidUserUseCaseModule } from './usecase/get-uuid-user/get-uuid-user.module';
import { HideCommentUseCaseModule } from './usecase/hide-comment/hide-comment.module';
import { GetTotalCountUseCaseModule } from './usecase/get-total-count/get-total-count-usecase.module';
import { CheckProxyBlockUseCaseModule } from './usecase/check-proxy-block/check-proxy-block-usecase.module';
import { CommentsModule } from '../comments/comments.module';
import { FacebookController } from './facebook.controller';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  imports: [
    HttpModule,
    GetInfoLinkUseCaseModule,
    GetCommentPublicUseCaseModule,
    GetCommentPrivateUseCaseModule,
    GetUuidUserUseCaseModule,
    HideCommentUseCaseModule,
    GetTotalCountUseCaseModule,
    CheckProxyBlockUseCaseModule,
    TypeOrmModule.forFeature([TokenEntity, CookieEntity, ProxyEntity, LinkEntity, CommentEntity, DelayEntity]),
    forwardRef(() => CommentsModule),
    ProxyModule
  ],
  controllers: [FacebookController],
  providers: [FacebookService],
  exports: [FacebookService],
})
export class FacebookModule { }
