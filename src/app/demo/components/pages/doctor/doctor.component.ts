import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
    selector: 'app-doctor',
    templateUrl: './doctor.component.html',
    styles: [
        `
            :host ::ng-deep .pi-eye,
            :host ::ng-deep .pi-eye-slash {
                transform: scale(1.6);
                margin-right: 1rem;
                color: var(--primary-color) !important;
            }
        `,
    ],
})
export class DoctorComponent implements OnInit {
    doctorForm!: FormGroup;
    loading: boolean = false;
    error: string | null = null;
    success: string | null = null;
    clinicName: string = '';
    clinicId: string = '';
    isEditMode: boolean = false;
    isViewMode: boolean = false;

    constructor(
        public layoutService: LayoutService,
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private messageService: MessageService,
    ) {}

    ngOnInit() {
        const doctorId = this.route.snapshot.queryParamMap.get('id');
        this.isEditMode =
            this.route.snapshot.queryParamMap.get('edit') === 'true';
        this.isViewMode =
            this.route.snapshot.queryParamMap.get('view') === 'true';
        if (doctorId) {
            this.loadDoctorDetails(doctorId);
        }
        this.clinicName =
            localStorage.getItem('clinicname') ||
            sessionStorage.getItem('clinicname') ||
            '';
        this.clinicId =
            localStorage.getItem('clinicid') ||
            sessionStorage.getItem('clinicid') ||
            '';

        this.doctorForm = this.fb.group({
            clinicName: [
                { value: this.clinicName, disabled: true },
                Validators.required,
            ],
            doctorname: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            specialization: ['', Validators.required],
        });
    }

    get f() {
        return this.doctorForm.controls;
    }

    onSubmit(): void {
        if (this.doctorForm.invalid) {
            this.doctorForm.markAllAsTouched();
            return;
        }

        const data = {
            staffname: this.doctorForm.value.doctorname,
            email: this.doctorForm.value.email,
            phone: this.doctorForm.value.phone,
            password: this.doctorForm.value.password,
            specialization: this.doctorForm.value.specialization,
            clinicId: this.clinicId,
            role: 'DOCTOR',
            active: this.doctorForm.value.isactive,
        };

        this.authService.createDoctor(data).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Doctor created successfully',
                });

                this.router.navigate(['/pages/doctor-list']);
            },

            error: (err) => {
                console.error(err);
            },
        });
    }

    onCancel() {
        this.doctorForm.reset();
        this.router.navigate(['/pages/doctor-list']);
    }

    loadDoctorDetails(doctorId: string) {
        this.loading = true;
        this.authService.getDoctorDetails(doctorId).subscribe({
            next: (res) => {
                console.log(res);
                const doctor = res.data.doctor;
                this.doctorForm.patchValue({
                    clinicName: this.clinicName,
                    doctorname: doctor.name,
                    email: doctor.email,
                    phone: doctor.phone,
                    specialization: doctor.specialization,
                });
                this.loading = false;
            },
            error: (err) => {
                this.error =
                    err?.error?.message ||
                    err?.message ||
                    'Failed to load doctor details';
                this.messageService.add({
                    key: 'tst',
                    severity: 'error',
                    summary: 'Error',
                    detail: this.error,
                });
                this.loading = false;
            },
        });
    }
}
