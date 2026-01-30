import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
    selector: 'app-doctor',
    templateUrl: './doctor.component.html',
    styles: [`
        :host ::ng-deep .pi-eye,
        :host ::ng-deep .pi-eye-slash {
            transform:scale(1.6);
            margin-right: 1rem;
            color: var(--primary-color) !important;
        }
    `]
})
export class DoctorComponent implements OnInit {

    doctorForm!: FormGroup;
    loading: boolean = false;
    error: string | null = null;
    success: string | null = null;
    clinicName: string = '';
    clinicId: string = '';

    constructor(
        public layoutService: LayoutService,
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.clinicName = localStorage.getItem('clinicname') || sessionStorage.getItem('clinicname') || '';
        this.clinicId = localStorage.getItem('clinicid') || sessionStorage.getItem('clinicid') || '';

        this.doctorForm = this.fb.group({
            clinicName: [{ value: this.clinicName, disabled: true }, Validators.required],
            doctorname: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            specialization: ['', Validators.required]
        });
    }

    get f() {
        return this.doctorForm.controls;
    }

    onSubmit() {
        if (this.doctorForm.invalid) {
            this.doctorForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.error = null;
        this.success = null;

        const { doctorname, email, phone, password, specialization } = this.doctorForm.value;

        this.authService.createDoctor(doctorname, email, phone, password, specialization, this.clinicId).subscribe({
            next: (res) => {
                if (res.success == true) {
                    this.success = 'Doctor created successfully!';
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Doctor created successfully' });
                    this.doctorForm.reset({
                        clinicName: this.clinicName
                    });
                    this.loading = false;
                    // Optionally redirect after delay
                    setTimeout(() => {
                        this.router.navigate(['/pages/doctor-list']);
                    }, 2000);
                }
            },
            error: (err) => {
                this.error = err?.error?.message || err?.message || 'Failed to create doctor';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: this.error });
                this.loading = false;
            },
            complete: () => this.loading = false
        });
    }

}
