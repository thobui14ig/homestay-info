import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { TokenModule } from "src/application/token/token.module";
import { ProxyModule } from "src/application/proxy/proxy.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LinkEntity } from "src/application/links/entities/links.entity";
import { GetInfoLinkUseCase } from "./get-info-link";

@Module({
    imports: [HttpModule, forwardRef(() => TokenModule), ProxyModule, TypeOrmModule.forFeature([LinkEntity])],
    controllers: [],
    providers: [GetInfoLinkUseCase],
    exports: [GetInfoLinkUseCase],
})
export class GetInfoLinkUseCaseModule { }
