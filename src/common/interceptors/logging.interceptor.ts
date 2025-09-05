import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const url = request.originalUrl;

    const now = new Date();
    return next.handle().pipe(
      tap(() => {
        const input = {
          method: request.method,
          url,
          now,
          body: request.body ?? null,
          params: request.params ?? null,
          query: request.query ?? null,
          user: request.user ?? null,
        };
        // console.log(input);
      }),
    );
  }
}
