import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SuperAdminApiService } from './superadmin-api.service';

@Component({ selector: 'app-superadmin-login', templateUrl: './superadmin-login.component.html', styleUrls: ['./superadmin.scss'] })
export class SuperAdminLoginComponent {
  form: any;
  loading = false;
  error = '';
  registered = false;

  constructor(fb: FormBuilder, private api: SuperAdminApiService, private router: Router, route: ActivatedRoute) {
    this.registered = route.snapshot.queryParamMap.get('registered') === '1';
    this.form = fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    this.api.login(this.form.value).subscribe({
      next: (response) => {
        this.saveSession(response);
        this.router.navigate(['/superadmin/clinics']);
      },
      error: (err) => { this.error = err?.error?.message || 'Login failed.'; this.loading = false; },
      complete: () => this.loading = false
    });
  }

  private saveSession(response: any): void {
    if (response?.token) {
      localStorage.setItem('token', response.token);
      sessionStorage.setItem('token', response.token);
    }
    const user = response?.user || response?.admin;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  }
}
