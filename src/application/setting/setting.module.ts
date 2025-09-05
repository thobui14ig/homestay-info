import { Module } from '@nestjs/common';
import { SettingService } from './setting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeywordEntity } from './entities/keyword';
import { DelayEntity } from './entities/delay.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KeywordEntity, DelayEntity])],

  controllers: [],
  providers: [SettingService],
  exports: [SettingService]
})
export class SettingModule { }
