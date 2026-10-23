import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { AuthService } from 'src/app/demo/service/auth.service';
import { MembershipAccessService } from 'src/app/core/membership-access.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'] 
})
export class RegisterComponent implements OnInit {

    registerForm!: FormGroup;
    loading: boolean = false;
    error: string | null = null;
    success: string | null = null;

    constructor(
        public layoutService: LayoutService,
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private membershipAccess: MembershipAccessService
    ) { }

    ngOnInit() {
        this.registerForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)]],
            confirmPassword: ['', [Validators.required]],
            clinicName: ['', [Validators.required, Validators.minLength(3)]]
        }, { validators: this.passwordMatchValidator });
    }

    get f() {
        return this.registerForm.controls;
    }

    passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    onSubmit() {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.error = null;
        this.success = null;

        const { email, phone, password, clinicName } = this.registerForm.value;

        this.authService.register(email, phone, password, clinicName).subscribe({
            next: (res) => {
                ['token', 'user', 'clinic'].forEach((key) => {
                    localStorage.removeItem(key);
                    sessionStorage.removeItem(key);
                });
                if (res?.token) {
                    localStorage.setItem('token', res.token);
                    sessionStorage.setItem('token', res.token);
                }
                if (res?.user) {
                    localStorage.setItem('user', JSON.stringify(res.user));
                    sessionStorage.setItem('user', JSON.stringify(res.user));
                }
                if (res?.clinic) {
                    localStorage.setItem('clinic', JSON.stringify(res.clinic));
                    sessionStorage.setItem('clinic', JSON.stringify(res.clinic));
                }
                if (res?.token) {
                    const destination = this.membershipAccess.hasActivePlan() ? '/' : '/pages/membership';
                    this.router.navigateByUrl(destination);
                } else {
                    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/pages/membership' } });
                }
            },
            error: (err) => {
                this.error = err?.error?.message || err?.message || 'Registration failed';
                this.loading = false;
            },
            complete: () => this.loading = false
        });
    }

}
