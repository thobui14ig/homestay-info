import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';
import { LinkEntity } from '../../links/entities/links.entity';
import { CommentEntity } from 'src/application/comments/entities/comment.entity';
import { CookieEntity } from 'src/application/cookie/entities/cookie.entity';

export enum LEVEL {
  ADMIN = 1,
  USER = 0
}

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ name: 'expired_at' })
  expiredAt: Date;

  @Column({ name: 'link_on_limit', default: null })
  linkOnLimit?: number;

  @Column({ name: 'link_off_limit', default: null })
  linkOffLimit?: number;

  @Column({ default: LEVEL.USER })
  level?: LEVEL;

  @Column({ name: 'delay_on_private', default: 5 })
  delayOnPrivate?: number;

  @Column({ name: 'delay_on_public', default: 5 })
  delayOnPublic?: number;

  @Column({ default: true, name: 'get_phone' })
  getPhone: Boolean;

  @Column({ default: null, name: 'account_fb_uuid' })
  accountFbUuid: string;

  @CreateDateColumn({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => LinkEntity, (link) => link.user)
  links: LinkEntity[]

  @OneToMany(() => CommentEntity, (comment) => comment.user)
  comments: CommentEntity[]

  @OneToMany(() => CookieEntity, (cookie) => cookie.user)
  cookies: CookieEntity[]
}
