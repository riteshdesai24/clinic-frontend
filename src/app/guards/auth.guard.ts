import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private router: Router) {}

  private checkAuth(): boolean | UrlTree {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (token) {
      return true;
    }

    return this.router.parseUrl('/auth/login');
  }

  canActivate(): boolean | UrlTree {
    return this.checkAuth();
  }

  canActivateChild(): boolean | UrlTree {
    return this.checkAuth();
  }
}