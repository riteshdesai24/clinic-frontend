import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { AuthService } from 'src/app/demo/service/auth.service';

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
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.registerForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]],
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

        const { name, email, phone, password, clinicName } = this.registerForm.value;

        this.authService.register(name, email, phone, password, clinicName).subscribe({
            next: (res) => {
                if (res.success == true) {
                    sessionStorage.setItem('clinicid', res.clinic._id);
                    sessionStorage.setItem('clinicname', res.clinic.name);
                    sessionStorage.setItem('clinicplan', res.clinic.plan);
                    sessionStorage.setItem('clinicphone', res.clinic.phone);
                    sessionStorage.setItem('useremail', res.user.email);
                    sessionStorage.setItem('userrole', res.user.role);
                    sessionStorage.setItem('userid', res.user._id);
                    sessionStorage.setItem('token', res.token);

                    localStorage.setItem('token', res.token);
                    localStorage.setItem('clinicid', res.clinic._id);
                    localStorage.setItem('clinicname', res.clinic.name);
                    localStorage.setItem('clinicplan', res.clinic.plan);
                    localStorage.setItem('clinicphone', res.clinic.phone);
                    localStorage.setItem('useremail', res.user.email);
                    localStorage.setItem('userrole', res.user.role);
                    localStorage.setItem('userid', res.user._id);

                    this.router.navigate(['/']);
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
