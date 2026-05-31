import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss']
})
export class StaffComponent implements OnInit {

  staffForm!: FormGroup;

  loading = false;
  error: string | null = null;
  success: string | null = null;
  passwordSent = false;

  clinicname = '';
  clinicId = '';
  adminEmail = 'riteshdesai24@gmail.com';

  roles = ['STAFF', 'DOCTOR'];

  isUser: string | null = null;
  isEdit = false;
  isview = false;

  userId: string | null = null;
  clinic: any = {};

  constructor(
    public layoutService: LayoutService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('id');
    this.isUser = this.route.snapshot.queryParamMap.get('isUser');

    if (this.userId) this.isEdit = true;

    const viewMode = this.route.snapshot.queryParamMap.get('view');
    if (viewMode === 'true') this.isview = true;

    this.clinic = localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}';
    this.clinic = JSON.parse(this.clinic);
    this.clinicname = this.clinic.clinicName || '';
    this.clinicId   = this.clinic._id || '';

    this.staffForm = this.fb.group({
      clinicName:     [{ value: this.clinicname, disabled: true }],
      staffname:      ['', [Validators.required, Validators.minLength(3)]],
      email:          ['', [Validators.required, Validators.email]],
      phone:          ['', Validators.required],
      // password:       [''],
      role:           ['STAFF', Validators.required],
      specialization: ['']
    });

    if (this.isUser === 'Doctor') {
      this.staffForm.patchValue({ role: 'DOCTOR' });
      this.staffForm.get('role')?.disable();
      this.staffForm.get('specialization')?.setValidators([Validators.required]);
      this.staffForm.get('specialization')?.updateValueAndValidity();
    }

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

    this.togglePasswordValidation();

    if (this.isEdit && this.userId) {
      if (this.isUser === 'Doctor') {
        this.loadDoctorDetails(this.userId);
      } else {
        this.loadStaffDetails(this.userId);
      }
    }

    if (this.isview) {
      this.staffForm.disable();
    }
  }

  get f() {
    return this.staffForm.controls;
  }

  togglePasswordValidation(): void {
    const pass = this.staffForm.get('password');
    if (this.isEdit || this.isview) {
      pass?.clearValidators();
      pass?.setValue('');
    } else {
      pass?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    pass?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }
    this.isEdit ? this.updateUser() : this.createUser();
  }

  createUser(): void {
    this.loading = true;
    const formData = this.staffForm.getRawValue();
    const data: any = {
      staffname: formData.staffname,
      email:     formData.email,
      phone:     formData.phone,
      role:      formData.role
    };

    // Only include specialization if DOCTOR
    if (formData.role === 'DOCTOR' && formData.specialization) {
      data.specialization = formData.specialization;
    }

    // Server auto-generates password — do not send from frontend
    const api$ = this.isUser === 'Doctor'
      ? this.authService.createDoctor(data)
      : this.authService.createStaff(data);

    api$.subscribe({
      next: () => {
        this.messageService.add({
          key: 'tst', severity: 'success',
          summary: 'Success',
          detail: 'Created successfully. Login credentials sent via email and SMS.'
        });
        this.afterSave();
      },
      error: err => this.handleError(err)
    });
  }

  updateUser(): void {
    if (!this.userId) return;
    this.loading = true;
    const data = this.staffForm.getRawValue();
    if (!data.password) delete data.password;

    const api$ = this.isUser === 'Doctor'
      ? this.authService.updateDoctor(this.userId, data)
      : this.authService.updateStaff(this.userId, data);

    api$.subscribe({
      next: () => {
        this.messageService.add({
          key: 'tst', severity: 'success',
          summary: 'Updated',
          detail: 'Updated successfully'
        });
        this.afterSave();
      },
      error: err => this.handleError(err)
    });
  }

  deleteUser(): void {
    if (!this.userId) return;
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.loading = true;

    const api$ = this.isUser === 'Doctor'
      ? this.authService.deleteDoctor(this.userId)
      : this.authService.deleteStaff(this.userId);

    api$.subscribe({
      next: () => {
        this.messageService.add({
          key: 'tst', severity: 'success',
          summary: 'Deleted',
          detail: 'Deleted successfully'
        });
        this.navigateBack();
      },
      error: err => this.handleError(err)
    });
  }

  loadStaffDetails(id: string): void {
    this.loading = true;
    this.authService.getStaffDetails(id).subscribe({
      next: res => {
        const s = res.data;   // ← API returns res.data directly
        this.staffForm.patchValue({
          staffname: s.staffname,
          email:     s.email,
          phone:     s.phone
        });
        this.togglePasswordValidation();
        this.loading = false;
      },
      error: err => this.handleError(err)
    });
  }

  loadDoctorDetails(id: string): void {
    this.loading = true;
    this.authService.getDoctorDetails(id).subscribe({
      next: res => {
        const d = res.data;   // ← API returns res.data directly
        this.staffForm.patchValue({
          staffname:      d.staffname,
          email:          d.email,
          phone:          d.phone,
          specialization: d.specialization
        });
        this.togglePasswordValidation();
        this.loading = false;
      },
      error: err => this.handleError(err)
    });
  }

  afterSave(): void {
    this.loading = false;
    setTimeout(() => this.navigateBack(), 1000);
  }

  navigateBack(): void {
    this.router.navigate([
      this.isUser === 'Doctor' ? '/pages/doctor-list' : '/pages/staff-list'
    ]);
  }

  handleError(err: any): void {
    this.loading = false;
    this.error = err?.error?.message || err?.message || 'Operation failed';
    this.messageService.add({
      key: 'tst', severity: 'error',
      summary: 'Error',
      detail: this.error ?? 'Something went wrong'
    });
  }

  onCancel(): void {
    this.navigateBack();
  }
}