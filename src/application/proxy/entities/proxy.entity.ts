import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum ProxyStatus {
    ACTIVE = 'active',
    IN_ACTIVE = 'inactive'
}

@Entity('proxy')
export class ProxyEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'proxy_address', type: 'varchar', length: 100 })
    proxyAddress: string;

    @Column({ default: 'active' })
    status: ProxyStatus;

    @Column({ default: false, name: "is_fb_block" })
    isFbBlock: Boolean;

    @Column({ name: 'error_code' })
    errorCode: string;
}
