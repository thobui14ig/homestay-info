import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RedisModule } from "src/infra/redis/redis.module";
import { CommentEntity } from "src/application/comments/entities/comment.entity";
import { LinkEntity } from "src/application/links/entities/links.entity";
import { LinkModule } from "src/application/links/links.module";
import { ProxyModule } from "src/application/proxy/proxy.module";
import { TokenModule } from "src/application/token/token.module";
import { GetCommentPublicUseCase } from "./get-comment-public";
import { GetInfoLinkUseCaseModule } from "../get-info-link/get-info-link-usecase.module";
import { SettingModule } from "src/application/setting/setting.module";

@Module({
    imports: [HttpModule, forwardRef(() => TokenModule), ProxyModule, TypeOrmModule.forFeature([LinkEntity, CommentEntity]), RedisModule, forwardRef(() => LinkModule), GetInfoLinkUseCaseModule, SettingModule],
    controllers: [],
    providers: [GetCommentPublicUseCase],
    exports: [GetCommentPublicUseCase],
})
export class GetCommentPublicUseCaseModule { }
