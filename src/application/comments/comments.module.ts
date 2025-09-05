import { forwardRef, Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CookieEntity } from '../cookie/entities/cookie.entity';
import { FacebookModule } from '../facebook/facebook.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity, CookieEntity]), forwardRef(() => FacebookModule)],
  controllers: [],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule { }
