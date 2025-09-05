import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { CheckProxyBlockUseCase } from "./check-proxy-block-usecase";

@Module({
    imports: [HttpModule],
    controllers: [],
    providers: [CheckProxyBlockUseCase],
    exports: [CheckProxyBlockUseCase],
})
export class CheckProxyBlockUseCaseModule { }
