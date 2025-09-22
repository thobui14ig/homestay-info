import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ProxyModule } from "src/application/proxy/proxy.module";
import { GetInfoLinkTiktokUseCase } from "./get-info-link-tiktok";

@Module({
    imports: [HttpModule, ProxyModule],
    controllers: [],
    providers: [GetInfoLinkTiktokUseCase],
    exports: [GetInfoLinkTiktokUseCase],
})
export class GetInfoLinkTiktokUseCaseModule { }
