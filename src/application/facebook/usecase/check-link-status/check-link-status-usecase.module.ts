import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { TokenModule } from "src/application/token/token.module";
import { CheckLinkUseCase } from "./check-link-status-usecase";
import { LinkModule } from "src/application/links/links.module";

@Module({
    imports: [HttpModule, forwardRef(() => TokenModule), forwardRef(() => LinkModule)],
    controllers: [],
    providers: [CheckLinkUseCase],
    exports: [CheckLinkUseCase],
})
export class CheckLinkUseCaseModule { }
