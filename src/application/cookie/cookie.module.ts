import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CookieService } from './cookie.service';
import { CookieEntity } from './entities/cookie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CookieEntity])],
  controllers: [],
  providers: [CookieService],
  exports: [CookieService]
})
export class CookieModule { }
