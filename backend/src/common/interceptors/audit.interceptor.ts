import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

const AUDIT_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    if (!AUDIT_METHODS.includes(method) || !user) {
      return next.handle();
    }

    const entity = this.extractEntity(url);
    const action = this.methodToAction(method);

    return next.handle().pipe(
      tap((responseData) => {
        this.auditService
          .log({
            tenantId: user.tenantId,
            userId: user.id,
            action,
            entity,
            entityId: responseData?.data?.id || null,
            newValue: method !== 'DELETE' ? responseData?.data : null,
            ipAddress: ip,
            userAgent: headers['user-agent'],
          })
          .catch(() => {}); // Non-blocking
      }),
    );
  }

  private extractEntity(url: string): string {
    const parts = url.split('/').filter(Boolean);
    // /api/v1/clients/123 → "Client"
    const entityPart = parts[2] || parts[1] || 'Unknown';
    return entityPart.charAt(0).toUpperCase() + entityPart.slice(1, -1);
  }

  private methodToAction(method: string): string {
    const map = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };
    return map[method] || method;
  }
}
