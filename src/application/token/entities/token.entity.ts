import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
export enum TokenStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LIMIT = 'limit',
  DIE = 'die',
}

export enum TokenType {
  EAADo1 = 'EAADo1',
  EAAAAAY = 'EAAAAAY',
}

export enum TokenHandle {
  CRAWL_CMT = 1,
  GET_INFO = 2
}

@Entity('token')
export class TokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'token_value', type: 'varchar', length: 255 })
  tokenValue: string;

  @Column({ name: 'token_value_v1', type: 'varchar', length: 255 })
  tokenValueV1: string;

  @Column({ type: 'enum', enum: TokenStatus, default: TokenStatus.ACTIVE })
  status: TokenStatus;

  @Column({ type: 'enum', enum: TokenHandle, default: TokenHandle.CRAWL_CMT })
  type: TokenHandle;

  @Column({ name: 'retry_count', type: 'int', default: 0, nullable: true })
  retryCount?: number;
}
