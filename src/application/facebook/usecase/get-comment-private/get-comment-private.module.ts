import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { TokenModule } from "src/application/token/token.module";
import { ProxyModule } from "src/application/proxy/proxy.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LinkEntity } from "src/application/links/entities/links.entity";
import { GetCommentPrivateUseCase } from "./get-comment-private";
import { RedisModule } from "@nestjs-modules/ioredis";
import { CheckLinkUseCaseModule } from "../check-link-status/check-link-status-usecase.module";
import { CookieModule } from "src/application/cookie/cookie.module";
import { SettingModule } from "src/application/setting/setting.module";

@Module({
    imports: [HttpModule, forwardRef(() => TokenModule), ProxyModule, TypeOrmModule.forFeature([LinkEntity]), RedisModule, CheckLinkUseCaseModule, CookieModule, SettingModule],
    controllers: [],
    providers: [GetCommentPrivateUseCase],
    exports: [GetCommentPrivateUseCase],
})
export class GetCommentPrivateUseCaseModule { }
