import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-patient',
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.scss']
})
export class PatientComponent implements OnInit {

  patientForm!: FormGroup;

  loading = false;
  error: string | null = null;
  success: string | null = null;

  clinicId = '';

  isEdit = false;
  isView = false;

  patientId: string | null = null;

  genders = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private api: AuthService,
    private msg: MessageService
  ) {}

  // ======================
  // INIT
  // ======================
  ngOnInit(): void {

    this.patientId = this.route.snapshot.queryParamMap.get('id');

    if (this.patientId) this.isEdit = true;

    if (this.route.snapshot.queryParamMap.get('view') === 'true') {
      this.isView = true;
    }

    this.clinicId =
      localStorage.getItem('clinicid') ||
      sessionStorage.getItem('clinicid') || '';

    this.patientForm = this.fb.group({
      firstName:        ['', Validators.required],
      lastName:         ['', Validators.required],
      phone:            ['', Validators.required],
      email:            [''],
      dob:              [''],
      age:              [''],
      gender:           ['', Validators.required],
      address1:         [''],
      address2:         [''],
      address3:         [''],
      pincode:          [''],
      medicalAllergies: ['']
    });

    if (this.isEdit) this.loadPatient();

    if (this.isView) this.patientForm.disable();
  }

  // ======================
  // GETTER
  // ======================
  get f() {
    return this.patientForm.controls;
  }

  // ======================
  // DOB → AGE
  // ======================
  onDobSelect(date: Date): void {
  if (!date) {
    this.patientForm.patchValue({ age: null });
    return;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  this.patientForm.patchValue({ age });
}

  // ======================
  // SUBMIT
  // ======================
  onSubmit(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }
    this.isEdit ? this.updatePatient() : this.createPatient();
  }

  // ======================
  // CREATE
  // ======================
  createPatient(): void {
    this.loading = true;

    const data = {
      ...this.patientForm.value,
      clinicId: this.clinicId
    };

    this.api.createPatient(data).subscribe({
      next: () => {
        this.success = 'Patient created successfully';
        this.msg.add({ severity: 'success', summary: 'Success', detail: this.success });
        this.afterSave();
      },
      error: err => this.handleError(err)
    });
  }

  // ======================
  // UPDATE
  // ======================
  updatePatient(): void {
    if (!this.patientId) return;
    this.loading = true;

    const data = {
      ...this.patientForm.value,
      clinicId: this.clinicId
    };

    this.api.updatePatient(this.patientId, data).subscribe({
      next: () => {
        this.success = 'Patient updated successfully';
        this.msg.add({ severity: 'success', summary: 'Updated', detail: this.success });
        this.afterSave();
      },
      error: err => this.handleError(err)
    });
  }

  // ======================
  // LOAD
  // ======================
  loadPatient(): void {
    this.loading = true;

    this.api.getPatientDetails(this.patientId!).subscribe({
      next: (res: any) => {
        const p = res.data.patient;

        if (p) {
          this.patientForm.patchValue({
            firstName:        p.firstName,
            lastName:         p.lastName,
            phone:            p.phone,
            email:            p.email,
            dob:              p.dob ? new Date(p.dob) : null,  
            age:              p.age,
            gender:           p.gender,
            address1:         p.address1,
            address2:         p.address2,
            address3:         p.address3,
            pincode:          p.pincode,
            medicalAllergies: p.medicalAllergies
          });
        }

        this.loading = false;
      },
      error: err => this.handleError(err)
    });
  }

  // Format ISO date → YYYY-MM-DD for date input
  formatDateForInput(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ======================
  // HELPERS
  // ======================
  afterSave(): void {
    this.loading = false;
    setTimeout(() => this.router.navigate(['/pages/patient-list']), 1000);
  }

  handleError(err: any): void {
    this.loading = false;
    this.error = err?.error?.message || err?.message || 'Operation failed';
    this.msg.add({ severity: 'error', summary: 'Error', detail: this.error });
  }

  onCancel(): void {
    this.router.navigate(['/pages/patient-list']);
  }
}