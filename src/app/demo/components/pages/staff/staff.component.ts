import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styles: [`
    :host ::ng-deep .pi-eye,
    :host ::ng-deep .pi-eye-slash {
      transform: scale(1.4);
      color: var(--primary-color);
    }
  `]
})
export class StaffComponent implements OnInit {

  staffForm!: FormGroup;

  loading = false;
  error: string | null = null;
  success: string | null = null;

  clinicName = '';
  clinicId = '';

  roles = ['STAFF', 'DOCTOR'];

  isUser: string | null = null;
  isEdit = false;
  isview = false;

  userId: string | null = null;

  constructor(
    public layoutService: LayoutService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  // ======================
  // INIT
  // ======================
  ngOnInit(): void {

    // Params
    this.userId = this.route.snapshot.queryParamMap.get('id');
    this.isUser = this.route.snapshot.queryParamMap.get('isUser');

    if (this.userId) this.isEdit = true;

    const viewMode = this.route.snapshot.queryParamMap.get('view');
    if (viewMode === 'true') this.isview = true;

    // Clinic
    this.clinicName =
      localStorage.getItem('clinicname') ||
      sessionStorage.getItem('clinicname') || '';

    this.clinicId =
      localStorage.getItem('clinicid') ||
      sessionStorage.getItem('clinicid') || '';

    // Form
    this.staffForm = this.fb.group({
      clinicName: [{ value: this.clinicName, disabled: true }],
      staffname: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: [''],
      role: ['STAFF', Validators.required],
      specialization: ['']
    });

    // Doctor role
    if (this.isUser === 'Doctor') {

      this.staffForm.patchValue({ role: 'DOCTOR' });
      this.staffForm.get('role')?.disable();
    }

    // Specialization validation
    this.staffForm.get('role')?.valueChanges.subscribe(role => {

      const spec = this.staffForm.get('specialization');

      if (role === 'DOCTOR') {
        spec?.setValidators([Validators.required]);
      } else {
        spec?.clearValidators();
        spec?.setValue('');
      }

      spec?.updateValueAndValidity();
    });

    // Password rules
    this.togglePasswordValidation();

    // Load data
    if (this.isEdit && this.userId) {

      if (this.isUser === 'Doctor') {
        this.loadDoctorDetails(this.userId);
      } else {
        this.loadStaffDetails(this.userId);
      }
    }

    // View mode
    if (this.isview) {
      this.staffForm.disable();
    }
  }

  // ======================
  // GETTER
  // ======================
  get f() {
    return this.staffForm.controls;
  }

  // ======================
  // PASSWORD RULES
  // ======================
  togglePasswordValidation(): void {

    const pass = this.staffForm.get('password');

    if (this.isEdit || this.isview) {

      pass?.clearValidators();
      pass?.setValue('');

    } else {

      pass?.setValidators([
        Validators.required,
        Validators.minLength(6)
      ]);
    }

    pass?.updateValueAndValidity();
  }

  // ======================
  // SUBMIT
  // ======================
  onSubmit(): void {

    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    if (this.isEdit) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  // ======================
  // CREATE
  // ======================
  createUser(): void {

    this.loading = true;

    const formData = this.staffForm.getRawValue();

    const data = {
      staffname: formData.staffname,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
      specialization: formData.specialization,
      clinicId: this.clinicId
    };

    this.authService.createStaff(data).subscribe({

      next: () => {

        this.success = 'User created successfully';

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.success
        });

        this.afterSave();
      },

      error: err => this.handleError(err)
    });
  }

  // ======================
  // UPDATE
  // ======================
  updateUser(): void {

    if (!this.userId) return;

    this.loading = true;

    const data = this.staffForm.getRawValue();

    if (!data.password) {
      delete data.password;
    }

    const api$ =
      this.isUser === 'Doctor'
        ? this.authService.updateDoctor(this.userId, data)
        : this.authService.updateStaff(this.userId, data);

    api$.subscribe({

      next: () => {

        this.success = 'User updated successfully';

        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: this.success
        });

        this.afterSave();
      },

      error: err => this.handleError(err)
    });
  }

  // ======================
  // DELETE
  // ======================
  deleteUser(): void {

    if (!this.userId) return;

    if (!confirm('Are you sure you want to delete this user?')) return;

    this.loading = true;

    const api$ =
      this.isUser === 'Doctor'
        ? this.authService.deleteDoctor(this.userId)
        : this.authService.deleteStaff(this.userId);

    api$.subscribe({

      next: () => {

        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'User deleted successfully'
        });

        this.navigateBack();
      },

      error: err => this.handleError(err)
    });
  }

  // ======================
  // LOAD STAFF
  // ======================
  loadStaffDetails(id: string): void {

    this.loading = true;

    this.authService.getStaffDetails(id).subscribe({

      next: res => {

        const s = res.data.staff;

        this.staffForm.patchValue({
          staffname: s.staffname,
          email: s.email,
          phone: s.phone
        });

        this.togglePasswordValidation();

        this.loading = false;
      },

      error: err => this.handleError(err)
    });
  }

  // ======================
  // LOAD DOCTOR
  // ======================
  loadDoctorDetails(id: string): void {

    this.loading = true;

    this.authService.getDoctorDetails(id).subscribe({

      next: res => {

        const d = res.data.doctor;

        this.staffForm.patchValue({
          staffname: d.staffname,
          email: d.email,
          phone: d.phone,
          specialization: d.specialization
        });

        this.togglePasswordValidation();

        this.loading = false;
      },

      error: err => this.handleError(err)
    });
  }

  // ======================
  // HELPERS
  // ======================
  afterSave(): void {

    this.loading = false;

    setTimeout(() => {
      this.navigateBack();
    }, 1000);
  }

  navigateBack(): void {

    this.router.navigate([
      this.isUser === 'Doctor'
        ? '/pages/doctor-list'
        : '/pages/staff-list'
    ]);
  }

  handleError(err: any): void {

    this.loading = false;

    this.error =
      err?.error?.message ||
      err?.message ||
      'Operation failed';

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: this.error
    });
  }

  onCancel(): void {
    this.navigateBack();
  }

}
