import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { TokenModule } from "src/application/token/token.module";
import { GetTotalCountUseCase } from "./get-total-count-usecase";
import { ProxyModule } from "src/application/proxy/proxy.module";

@Module({
    imports: [HttpModule, forwardRef(() => TokenModule), ProxyModule],
    controllers: [],
    providers: [GetTotalCountUseCase],
    exports: [GetTotalCountUseCase],
})
export class GetTotalCountUseCaseModule { }
