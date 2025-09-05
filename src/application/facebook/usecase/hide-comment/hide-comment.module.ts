import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { ProxyModule } from "src/application/proxy/proxy.module";
import { TokenModule } from "src/application/token/token.module";
import { HideCommentUseCase } from "./hide-comment";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommentEntity } from "src/application/comments/entities/comment.entity";
import { CookieEntity } from "src/application/cookie/entities/cookie.entity";
import { KeywordEntity } from "src/application/setting/entities/keyword";

@Module({
    imports: [HttpModule, ProxyModule, TokenModule, TypeOrmModule.forFeature([CommentEntity, CookieEntity])],
    controllers: [],
    providers: [HideCommentUseCase],
    exports: [HideCommentUseCase],
})
export class HideCommentUseCaseModule { }
