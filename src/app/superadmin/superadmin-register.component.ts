import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SuperAdminApiService } from './superadmin-api.service';

@Component({ selector: 'app-superadmin-register', templateUrl: './superadmin-register.component.html', styleUrls: ['./superadmin.scss'] })
export class SuperAdminRegisterComponent {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(fb: FormBuilder, private api: SuperAdminApiService, private router: Router) {
    this.form = fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatch });
  }

  private passwordsMatch(group: FormGroup): { [key: string]: boolean } | null {
    return group.get('password')?.value === group.get('confirmPassword')?.value ? null : { passwordMismatch: true };
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    const { name, email, password } = this.form.value;
    this.api.register({ name, email, password }).subscribe({
      next: (response) => {
        if (response?.token) {
          localStorage.setItem('token', response.token);
          sessionStorage.setItem('token', response.token);
        }
        const user = response?.user || response?.admin;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          sessionStorage.setItem('user', JSON.stringify(user));
        }
        this.router.navigate(['/superadmin/login'], { queryParams: { registered: '1' } });
      },
      error: (err) => { this.error = err?.error?.message || 'Registration failed.'; this.loading = false; },
      complete: () => this.loading = false
    });
  }
}
