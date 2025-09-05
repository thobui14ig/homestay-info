import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from './application/user/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { LinkModule } from './application/links/links.module';
import { LinkEntity } from './application/links/entities/links.entity';
import { CommentsModule } from './application/comments/comments.module';
import { CommentEntity } from './application/comments/entities/comment.entity';
import { CookieModule } from './application/cookie/cookie.module';
import { TokenModule } from './application/token/token.module';
import { ProxyModule } from './application/proxy/proxy.module';
import { ProxyEntity } from './application/proxy/entities/proxy.entity';
import { CookieEntity } from './application/cookie/entities/cookie.entity';
import { TokenEntity } from './application/token/entities/token.entity';
import { SettingModule } from './application/setting/setting.module';
import { KeywordEntity } from './application/setting/entities/keyword';
import { DelayEntity } from './application/setting/entities/delay.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { FacebookModule } from './application/facebook/facebook.module';
import { MonitoringModule } from './application/monitoring/monitoring.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'frontend'),
      exclude: ['/^\/api/'], // Đây là cách chắc chắn đúng
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: configService.get<string>('DB_TYPE') as any,
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT', '3306'), 10),
        username: configService.get<string>('DB_USER_NAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          UserEntity,
          LinkEntity,
          CommentEntity,
          ProxyEntity,
          CookieEntity,
          TokenEntity,
          KeywordEntity,
          DelayEntity,
        ],
        // logging: true,
        // synchronize: true, // chỉ dùng trong dev!
      }),
    }),
    JwtModule.register({
      secret: 'reset',
    }),
    BullModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    LinkModule,
    CommentsModule,
    CookieModule,
    TokenModule,
    ProxyModule,
    SettingModule,
    FacebookModule,
    MonitoringModule,
    EventEmitterModule.forRoot()
  ],

})
export class AppModule { }
