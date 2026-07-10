import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-insurance',
  templateUrl: './insurance.component.html',
  styleUrls: ['./insurance.component.scss']
})
export class InsuranceComponent implements OnInit {

  insuranceForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  clinicId = '';
  clinicData: any = {};
  insuranceId: string | null = null;
  isEdit = false;
  isView = false;

  policyTypes = [
    { label: 'Health', value: 'HEALTH' },
    { label: 'Dental', value: 'DENTAL' },
    { label: 'Life', value: 'LIFE' },
    { label: 'Motor', value: 'MOTOR' },
    { label: 'Travel', value: 'TRAVEL' }
  ];

  statuses = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Expired', value: 'EXPIRED' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private api: AuthService,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.insuranceId = this.route.snapshot.queryParamMap.get('id');
    if (this.insuranceId) {
      this.isEdit = true;
    }

    if (this.route.snapshot.queryParamMap.get('view') === 'true') {
      this.isView = true;
    }

    this.clinicData = JSON.parse(
      localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}'
    );

    this.clinicId = this.clinicData._id || '';

    this.insuranceForm = this.fb.group({
      insurerName: ['', Validators.required],
      company: ['', Validators.required],
      policyNumber: ['', Validators.required],
      policyType: ['HEALTH'],
      coverageAmount: [''],
      startDate: [''],
      endDate: [''],
      contactNumber: [''],
      email: ['', Validators.email],
      status: ['ACTIVE'],
      notes: ['']
    });

    if (this.isEdit) {
      this.loadInsurance();
    }

    if (this.isView) {
      this.insuranceForm.disable();
    }
  }

  get f() {
    return this.insuranceForm.controls;
  }

  onSubmit(): void {
    if (this.insuranceForm.invalid) {
      this.insuranceForm.markAllAsTouched();
      return;
    }

    this.isEdit ? this.updateInsurance() : this.createInsurance();
  }

  createInsurance(): void {
    this.loading = true;

    const data = {
      ...this.insuranceForm.value,
      clinicId: this.clinicId
    };

    this.api.createInsurance(data).subscribe({
      next: () => {
        this.success = 'Insurance record created successfully';
        this.msg.add({ severity: 'success', summary: 'Success', detail: this.success });
        this.afterSave();
      },
      error: err => this.handleError(err)
    });
  }

  updateInsurance(): void {
    if (!this.insuranceId) {
      return;
    }

    this.loading = true;

    const data = {
      ...this.insuranceForm.value,
      clinicId: this.clinicId
    };

    this.api.updateInsurance(this.insuranceId, data).subscribe({
      next: () => {
        this.success = 'Insurance record updated successfully';
        this.msg.add({ severity: 'success', summary: 'Updated', detail: this.success });
        this.afterSave();
      },
      error: err => this.handleError(err)
    });
  }

  loadInsurance(): void {
    if (!this.insuranceId) {
      return;
    }

    this.loading = true;

    this.api.getInsuranceDetails(this.insuranceId).subscribe({
      next: (res: any) => {
        const i = res.data?.insurance;
        if (i) {
          this.insuranceForm.patchValue({
            insurerName: i.insurerName,
            company: i.company,
            policyNumber: i.policyNumber,
            policyType: i.policyType,
            coverageAmount: i.coverageAmount,
            startDate: i.startDate ? new Date(i.startDate) : null,
            endDate: i.endDate ? new Date(i.endDate) : null,
            contactNumber: i.contactNumber,
            email: i.email,
            status: i.status,
            notes: i.notes
          });
        }
        this.loading = false;
      },
      error: err => this.handleError(err)
    });
  }

  afterSave(): void {
    this.loading = false;
    setTimeout(() => this.router.navigate(['/pages/insurance-list']), 1000);
  }

  handleError(err: any): void {
    this.loading = false;
    this.error = err?.error?.message || err?.message || 'Operation failed';
    this.msg.add({ severity: 'error', summary: 'Error', detail: this.error });
  }

  onCancel(): void {
    this.router.navigate(['/pages/insurance-list']);
  }
}
