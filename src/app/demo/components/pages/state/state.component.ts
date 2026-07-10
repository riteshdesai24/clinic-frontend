import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-state',
  templateUrl: './state.component.html',
  styleUrls: ['./state.component.scss']
})
export class StateComponent implements OnInit {
  stateForm!: FormGroup;
  loading = false;
  success: string | null = null;
  error: string | null = null;
  clinicId = '';
  clinicData: any = {};
  stateId: string | null = null;
  isEdit = false;
  isView = false;

  statuses = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private api: AuthService,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.clinicData = JSON.parse(
      localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}'
    );
    this.clinicId = this.clinicData._id || '';
    this.stateId = this.route.snapshot.queryParamMap.get('id');
    this.isView = this.route.snapshot.queryParamMap.get('view') === 'true';

    this.stateForm = this.fb.group({
      stateName: ['', Validators.required],
      stateCode: ['', Validators.required],
      country: ['', Validators.required],
      status: ['ACTIVE', Validators.required],
      notes: ['']
    });

    if (this.stateId) {
      this.isEdit = true;
      this.loadState();
    }

    if (this.isView) {
      this.stateForm.disable();
    }
  }

  get f(): { [key: string]: any } {
    return this.stateForm.controls;
  }

  loadState(): void {
    if (!this.stateId) {
      return;
    }

    this.loading = true;
    this.api.getStateDetails(this.stateId).subscribe({
      next: (res: any) => {
        const state = res.data || res;
        this.stateForm.patchValue({
          stateName: state.stateName || state.name || '',
          stateCode: state.stateCode || state.code || '',
          country: state.country || '',
          status: state.status || 'ACTIVE',
          notes: state.notes || ''
        });
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Failed to load state';
      }
    });
  }

  onSubmit(): void {
    if (this.isView || this.stateForm.invalid) {
      this.stateForm.markAllAsTouched();
      return;
    }

    this.isEdit ? this.updateState() : this.createState();
  }

  createState(): void {
    this.loading = true;
    const payload = { clinicId: this.clinicId, ...this.stateForm.value };
    this.api.createState(payload).subscribe({
      next: () => {
        this.loading = false;
        this.msg.add({ severity: 'success', summary: 'Saved', detail: 'State created successfully' });
        this.router.navigate(['/pages/state-list']);
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Save failed';
      }
    });
  }

  updateState(): void {
    if (!this.stateId) {
      return;
    }

    this.loading = true;
    const payload = { clinicId: this.clinicId, ...this.stateForm.value };
    this.api.updateState(this.stateId, payload).subscribe({
      next: () => {
        this.loading = false;
        this.msg.add({ severity: 'success', summary: 'Updated', detail: 'State updated successfully' });
        this.router.navigate(['/pages/state-list']);
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Update failed';
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/state-list']);
  }
}
