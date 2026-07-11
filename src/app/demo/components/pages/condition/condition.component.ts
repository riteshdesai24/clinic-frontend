import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({ selector: 'app-condition', templateUrl: './condition.component.html', styleUrls: ['./condition.component.scss'] })
export class ConditionComponent implements OnInit {
  form!: FormGroup;
  type: 'MEDICAL' | 'DENTAL' = 'MEDICAL';
  conditionId: string | null = null;
  isEdit = false;
  loading = false;
  error = '';
  clinicData: any = {};
  statuses = [{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }];

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private api: AuthService) {}

  ngOnInit(): void {
    this.type = this.route.snapshot.queryParamMap.get('type') === 'DENTAL' ? 'DENTAL' : 'MEDICAL';
    this.conditionId = this.route.snapshot.queryParamMap.get('id');
    this.isEdit = !!this.conditionId;
    this.clinicData = JSON.parse(localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}');
    this.form = this.fb.group({ name: ['', Validators.required], description: [''], status: ['ACTIVE', Validators.required] });
    if (this.conditionId) this.loadCondition();
  }

  get f() { return this.form.controls; }
  get title() { return this.type === 'MEDICAL' ? 'Medical Condition' : 'Dental Condition'; }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    const request = this.isEdit && this.conditionId
      ? this.api.updateCondition(this.conditionId, this.form.value)
      : this.api.createCondition({ ...this.form.value, type: this.type });
    request.subscribe({ next: () => this.cancel(), error: err => { this.loading = false; this.error = err?.error?.message || 'Unable to save condition.'; } });
  }

  private loadCondition(): void {
    this.loading = true;
    this.api.getConditionDetails(this.conditionId!).subscribe({
      next: (res: any) => { this.form.patchValue(res?.data || res); this.loading = false; },
      error: err => { this.loading = false; this.error = err?.error?.message || 'Unable to load condition.'; }
    });
  }

  cancel(): void { this.router.navigate([this.type === 'MEDICAL' ? '/pages/medical-condition-list' : '/pages/dental-condition-list']); }
}
