import { LinkEntity } from 'src/application/links/entities/links.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

export interface IKeyword {
    id: number;
    keyword: string | null;
    createdAt: Date;
    userId: number;
}

@Entity('keywords')
export class KeywordEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', nullable: true })
    keyword: string | null;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @Column({ name: 'link_id', type: 'int' })
    linkId: number;

    @ManyToOne(() => LinkEntity, (link) => link.comments)
    @JoinColumn({ name: 'link_id' })
    link: LinkEntity
}
