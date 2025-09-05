import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export interface IDelay {
    id: number;
    delayCheck: number;
    updatedAt: Date;
    delayLinkOn: number;
    delayLinkOff: number;
}

@Entity('delay')
export class DelayEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'refresh_cookie', type: 'int', default: 0 })
    refreshCookie: number;

    @Column({ name: 'updated_at', type: 'datetime' })
    updatedAt: Date;

    @Column({ name: 'refresh_token', type: 'int', default: 0 })
    refreshToken: number;

    @Column({ name: 'refresh_proxy', type: 'int', default: 0 })
    refreshProxy: number;

    @Column({ name: 'delay_on_public', type: 'int', default: 0 })
    delayOnPublic: number;

    @Column({ name: 'delay_off_private', type: 'int', default: 0 })
    delayOffPrivate: number;

    @Column({ name: 'delay_off', type: 'int', default: 0 })
    delayOff: number;

    @Column({ name: 'delay_comment_count', type: 'int', default: 0 })
    delayCommentCount: number;

    @Column({ name: 'time_remove_proxy_slow', type: 'int', default: 0 })
    timeRemoveProxySlow: number;
}
