import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
    selector: 'app-staff',
    templateUrl: './staff.component.html',
    styles: [`
        :host ::ng-deep .pi-eye,
        :host ::ng-deep .pi-eye-slash {
            transform:scale(1.6);
            margin-right: 1rem;
            color: var(--primary-color) !important;
        }
    `]
})
export class StaffComponent implements OnInit {

    staffForm!: FormGroup;
    loading: boolean = false;
    error: string | null = null;
    success: string | null = null;
    clinicName: string = '';
    clinicId: string = '';
    roles = ['ADMIN', 'STAFF'];

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

        this.staffForm = this.fb.group({
            clinicName: [{ value: this.clinicName, disabled: true }, Validators.required],
            staffname: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            role: ['STAFF', Validators.required]
        });
    }

    get f() {
        return this.staffForm.controls;
    }

    onSubmit() {
        if (this.staffForm.invalid) {
            this.staffForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.error = null;
        this.success = null;

        const { staffname, email, phone, password, role } = this.staffForm.value;

        this.authService.createStaff(staffname, email, phone, password, role, this.clinicId).subscribe({
            next: (res) => {
                if (res.success == true) {
                    this.success = 'Staff created successfully!';
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Staff member created successfully' });
                    this.staffForm.reset({
                        clinicName: this.clinicName,
                        role: 'STAFF'
                    });
                    this.loading = false;
                    // Optionally redirect after delay
                    setTimeout(() => {
                        this.router.navigate(['/pages/staff-list']);
                    }, 2000);
                }
            },
            error: (err) => {
                this.error = err?.error?.message || err?.message || 'Failed to create staff';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: this.error });
                this.loading = false;
            },
            complete: () => this.loading = false
        });
    }

}
