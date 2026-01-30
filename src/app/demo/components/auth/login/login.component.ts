import { Component, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styles: [`
        :host ::ng-deep .pi-eye,
        :host ::ng-deep .pi-eye-slash {
            transform:scale(1.6);
            margin-right: 1rem;
            color: var(--primary-color) !important;
        }
    `]
})
export class LoginComponent implements OnInit {

    loginForm!: FormGroup;

    loading: boolean = false;
    error: string | null = null;

    constructor(public layoutService: LayoutService, private fb: FormBuilder, private router: Router, private authService: AuthService) { }

    ngOnInit() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            remember: [false]
        });
    }

    get f() {
        return this.loginForm.controls;
    }

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
                // try {
                //     const serialized = typeof res === 'string' ? res : JSON.stringify(res);
                //    
                // } catch (e) {
                //     console.warn('Failed to serialize auth response', e);
                // }
                if (res.success == true) {
                     sessionStorage.setItem('clinicid', res.clinic._id);
                     sessionStorage.setItem('clinicname', res.clinic.name);
                     sessionStorage.setItem('clinicplan', res.clinic.plan);
                     sessionStorage.setItem('useremail', res.user.email);
                     sessionStorage.setItem('userrole', res.user.role);
                     sessionStorage.setItem('userid', res.user._id);
                     sessionStorage.setItem('token', res.token);

                     localStorage.setItem('token', res.token);
                     localStorage.setItem('clinicid', res.clinic._id);
                     localStorage.setItem('clinicname', res.clinic.name);
                     localStorage.setItem('clinicplan', res.clinic.plan);
                     localStorage.setItem('useremail', res.user.email);
                     localStorage.setItem('userrole', res.user.role);
                     localStorage.setItem('userid', res.user._id);
                     this.router.navigate(['/']);
                }
            },
            error: (err) => {
                this.error = err?.error?.message || err?.message || 'Login failed';
                this.loading = false;
            },
            complete: () => this.loading = false
        });
    }

}

