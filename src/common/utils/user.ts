import { Request } from 'express';
import { UserEntity } from 'src/application/user/entities/user.entity';

export const getUser = (req: Request): UserEntity => {
  return req['user'];
};
