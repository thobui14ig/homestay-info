import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { CommentEntity } from 'src/application/comments/entities/comment.entity';
import { KeywordEntity } from 'src/application/setting/entities/keyword';

export enum LinkStatus {
  Pending = 'pending',
  Started = 'started',
}

export enum LinkType {
  DIE = 'die',
  UNDEFINED = 'undefined',
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum HideBy {
  ALL = 'all',
  PHONE = 'phone',
  KEYWORDS = 'keywords'
}

export enum CrawType {
  FACEBOOK = 'facebook',
  TIKTOK = 'tiktok'
}

@Entity('links')
export class LinkEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ length: 255, name: 'link_name', nullable: true })
  linkName: string;

  @Column({ name: 'content', nullable: true })
  content: string;

  @Column({ length: 255, name: 'link_url' })
  linkUrl: string;

  @Column({ length: 255, nullable: true, name: 'post_id' })
  postId: string | null;

  @Column({ length: 255, nullable: true, name: 'post_id_v1' })
  postIdV1: string | null;

  @Column({ length: 255, nullable: true, name: 'page_id' })
  pageId: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'last_comment_time' })
  lastCommentTime: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'time_craw_update' })
  timeCrawUpdate: Date | null;

  @Column({ type: 'int', default: 0, name: 'comment_count' })
  commentCount: number;

  @Column({ type: 'int', default: 0, name: 'delay_time' })
  delayTime: number;

  @Column({ type: 'int', default: 0 })
  like: number;

  @Column({ default: 'pending' })
  status: LinkStatus;

  @Column()
  type: LinkType;

  @Column({ length: 255, name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ default: false })
  process: boolean;

  @Column({ name: 'count_before', type: 'int' })
  countBefore: number;

  @Column({ name: 'count_after', type: 'int' })
  countAfter: number;

  @Column({ name: 'like_before', type: 'int' })
  likeBefore: number;

  @Column({ name: 'like_after', type: 'int' })
  likeAfter: number;

  @Column({ name: 'hide_cmt', type: 'boolean' })
  hideCmt: boolean;

  @Column({ name: 'hide_by', default: 'all' })
  hideBy: HideBy;

  @Column({ name: 'post_id_die', type: 'boolean' })
  postIdDie: boolean;

  @Column({ name: 'post_id_v1_die', type: 'boolean' })
  postIdV1Die: boolean;

  @Column({ name: 'thread' })
  thread: number;

  @Column({ name: 'craw_type' })
  crawType: CrawType;

  @CreateDateColumn({
    type: 'datetime',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.links)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => CommentEntity, (comment) => comment.link)
  comments: CommentEntity[];

  @OneToMany(() => KeywordEntity, (keyword) => keyword.link)
  keywords: KeywordEntity[];
}
