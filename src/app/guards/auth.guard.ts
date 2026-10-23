import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { MembershipAccessService } from '../core/membership-access.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private router: Router, private membershipAccess: MembershipAccessService) {}

  private checkAuth(url: string): boolean | UrlTree {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) return this.router.parseUrl('/landing');
    if (url.split('?')[0].replace(/\/$/, '') === '/pages/membership') return true;
    if (!this.membershipAccess.hasActivePlan()) return this.router.parseUrl('/pages/membership');

    return true;
  }

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkAuth(state.url);
  }

  canActivateChild(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkAuth(state.url);
  }
}
