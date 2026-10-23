import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/demo/service/auth.service';
import { MembershipAccessService } from 'src/app/core/membership-access.service';

@Component({
    selector: 'app-login',
    styleUrls: ['./login.component.scss'],
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

    loginForm!: FormGroup;
    forgotForm!: FormGroup;

    showForgot = false;
    loading = false;
    error: string | null = null;
    resetMessage: string | null = null;

    constructor(
        public layoutService: LayoutService,
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private membershipAccess: MembershipAccessService
    ) {}

    ngOnInit() {
        this.initForms();
    }

    // ✅ Initialize Forms
    private initForms() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });

        this.forgotForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    // ✅ Toggle Forgot/Login
    toggleForgot() {
        this.showForgot = !this.showForgot;

        this.error = null;
        this.resetMessage = null;

        // Reset forms for better UX
        this.loginForm.reset();
        this.forgotForm.reset();
    }

    // ✅ LOGIN
    onSubmit() {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.error = null;

        const { email, password } = this.loginForm.value;

        this.authService.login(email, password).subscribe({
            next: (res) => {
                ['token', 'user', 'clinic'].forEach((key) => {
                    localStorage.removeItem(key);
                    sessionStorage.removeItem(key);
                });
                // ✅ Store token safely
                if (res?.token) {
                    localStorage.setItem('token', res.token);
                    sessionStorage.setItem('token', res.token);
                }

                // Optional: store user data
                if (res?.user) {
                    localStorage.setItem('user', JSON.stringify(res.user));
                    sessionStorage.setItem('user', JSON.stringify(res.user));
                }
                if (res?.clinic) {
                    localStorage.setItem('clinic', JSON.stringify(res.clinic));
                    sessionStorage.setItem('clinic', JSON.stringify(res.clinic));
                }

                const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
                const destination = typeof returnUrl === 'string' && returnUrl.startsWith('/')
                    ? returnUrl
                    : this.membershipAccess.hasActivePlan() ? '/' : '/pages/membership';
                this.router.navigateByUrl(destination);
            },

            error: (err) => {
                this.error = err?.error?.message || 'Invalid email or password';
                this.loading = false;
            },

            complete: () => {
                this.loading = false;
            }
        });
    }

    // ✅ FORGOT PASSWORD
    onForgotSubmit() {
        if (this.forgotForm.invalid) {
            this.forgotForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.error = null;
        this.resetMessage = null;

        const { email } = this.forgotForm.value;

        this.authService.forgotPassword(email).subscribe({
            next: (res) => {
                this.resetMessage = res?.message || 'Reset link sent successfully';
            },

            error: (err) => {
                this.error = err?.error?.message || 'Failed to send reset link';
                this.loading = false;
            },

            complete: () => {
                this.loading = false;
            }
        });
    }

    // ✅ Helpers (for UI validation)
    isInvalid(controlName: string, form: FormGroup) {
        const control = form.get(controlName);
        return control?.invalid && (control?.touched || control?.dirty);
    }
}
