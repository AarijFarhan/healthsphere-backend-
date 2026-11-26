import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    if (process.env.DEMO_MODE === 'true') {
      const request = context.switchToHttp().getRequest();
      if (request.headers.authorization === 'Bearer demo-jwt-token') {
        request.user = { sub: 'demo-user-id', email: 'demo@healthsphere.local', role: 'demo' };
        return true;
      }
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
