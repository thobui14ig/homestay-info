import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacebookModule } from '../facebook/facebook.module';
import { TokenEntity } from './entities/token.entity';
import { TokenService } from './token.service';

@Module({
  imports: [TypeOrmModule.forFeature([TokenEntity]), forwardRef(() => FacebookModule)],
  controllers: [],
  providers: [TokenService],
  exports: [TokenService]
})
export class TokenModule { }
