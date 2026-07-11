import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-treatment',
  templateUrl: './treatment.component.html',
  styleUrls: ['./treatment.component.scss']
})
export class TreatmentComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error = '';
  treatmentId: string | null = null;
  isEdit = false;
  clinicId = '';
  clinicData: any = {};
  statuses = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
  ];

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private api: AuthService) {}

  ngOnInit(): void {
    this.clinicData = JSON.parse(localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}');
    this.clinicId = localStorage.getItem('clinicid')
      || sessionStorage.getItem('clinicid')
      || this.clinicData._id
      || '';
    this.treatmentId = this.route.snapshot.queryParamMap.get('id');
    this.isEdit = !!this.treatmentId;
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      duration: [null, [Validators.min(0)]],
      price: [null, [Validators.min(0)]],
      status: ['ACTIVE', Validators.required]
    });
    if (this.treatmentId) this.loadTreatment();
  }

  get f() { return this.form.controls; }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    const payload = { ...this.form.value, clinicId: this.clinicId };
    const request = this.isEdit && this.treatmentId
      ? this.api.updateTreatment(this.treatmentId, payload)
      : this.api.createTreatment(payload);
    request.subscribe({
      next: () => this.router.navigate(['/pages/treatment-list']),
      error: (err) => { this.loading = false; this.error = err?.error?.message || 'Unable to save treatment.'; }
    });
  }

  private loadTreatment(): void {
    this.loading = true;
    this.api.getTreatmentDetails(this.treatmentId!).subscribe({
      next: (res: any) => { this.form.patchValue(res?.data?.treatment || res?.data || res); this.loading = false; },
      error: (err) => { this.error = err?.error?.message || 'Unable to load treatment.'; this.loading = false; }
    });
  }

  cancel(): void { this.router.navigate(['/pages/treatment-list']); }
}
