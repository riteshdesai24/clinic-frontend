import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
    selector: 'app-login',
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
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]]
        });

        this.forgotForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    toggleForgot() {
        this.showForgot = !this.showForgot;
        this.error = null;
        this.resetMessage = null;
    }

    onSubmit() {
        if (this.loginForm.invalid) return;

        this.loading = true;
        const { email, password } = this.loginForm.value;

        this.authService.login(email, password).subscribe({
            next: (res) => {
                localStorage.setItem('token', res.token);
                this.router.navigate(['/']);
            },
            error: err => {
                this.error = err?.error?.message || 'Login failed';
                this.loading = false;
            },
            complete: () => this.loading = false
        });
    }

    onForgotSubmit() {
        if (this.forgotForm.invalid) return;

        this.loading = true;
        const { email } = this.forgotForm.value;

        this.authService.forgotPassword(email).subscribe({
            next: res => {
                this.resetMessage = res.message || 'Reset link sent';
            },
            error: err => {
                this.error = err?.error?.message || 'Failed to send reset link';
            },
            complete: () => this.loading = false
        });
    }
}
