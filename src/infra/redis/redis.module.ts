import { Global, Module } from '@nestjs/common';
import { RedisModule as NestRedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { RedisService } from './redis.service';
import { RedisOptions } from 'ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
    imports: [
        NestRedisModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService): Promise<RedisModuleOptions> => ({
                type: configService.get<string>('REDIS_TYPE', 'single') as 'single',
                options: {
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: Number(configService.get<string>('REDIS_PORT', '6379')),
                } as RedisOptions,
            }),
        }),
    ],
    providers: [RedisService],
    exports: [RedisService],
})
export class RedisModule { }
