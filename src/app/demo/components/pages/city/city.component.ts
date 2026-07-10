import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-city',
  templateUrl: './city.component.html',
  styleUrls: ['./city.component.scss']
})
export class CityComponent implements OnInit {
  cityForm!: FormGroup;
  loading = false;
  success: string | null = null;
  error: string | null = null;
  clinicId = '';
  clinicData: any = {};
  cityId: string | null = null;
  isEdit = false;
  isView = false;

  states: any[] = [];
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
    this.cityId = this.route.snapshot.queryParamMap.get('id');
    this.isView = this.route.snapshot.queryParamMap.get('view') === 'true';

    this.cityForm = this.fb.group({
      cityName: ['', Validators.required],
      cityCode: ['', Validators.required],
      stateId: ['', Validators.required],
      country: ['', Validators.required],
      status: ['ACTIVE', Validators.required],
      notes: ['']
    });

    this.loadStates();

    if (this.cityId) {
      this.isEdit = true;
      this.loadCity();
    }

    if (this.isView) {
      this.cityForm.disable();
    }
  }

  get f(): { [key: string]: any } {
    return this.cityForm.controls;
  }

  loadStates(): void {
    this.api.getStateList(this.clinicId).subscribe({
      next: (res: any) => {
        const list = res.data || res || [];
        this.states = list.map((item: any) => ({
          label: item.stateName || item.name || '',
          value: item._id || item.id || ''
        }));
      },
      error: () => {
        this.states = [];
      }
    });
  }

  loadCity(): void {
    if (!this.cityId) {
      return;
    }

    this.loading = true;
    this.api.getCityDetails(this.cityId).subscribe({
      next: (res: any) => {
        const city = res.data || res;
        this.cityForm.patchValue({
          cityName: city.cityName || city.name || '',
          cityCode: city.cityCode || city.code || '',
          stateId: city.stateId || city.state?._id || '',
          country: city.country || '',
          status: city.status || 'ACTIVE',
          notes: city.notes || ''
        });
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Failed to load city';
      }
    });
  }

  onSubmit(): void {
    if (this.isView || this.cityForm.invalid) {
      this.cityForm.markAllAsTouched();
      return;
    }

    this.isEdit ? this.updateCity() : this.createCity();
  }

  createCity(): void {
    this.loading = true;
    const payload = { clinicId: this.clinicId, ...this.cityForm.value };
    this.api.createCity(payload).subscribe({
      next: () => {
        this.loading = false;
        this.msg.add({ severity: 'success', summary: 'Saved', detail: 'City created successfully' });
        this.router.navigate(['/pages/city-list']);
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Save failed';
      }
    });
  }

  updateCity(): void {
    if (!this.cityId) {
      return;
    }

    this.loading = true;
    const payload = { clinicId: this.clinicId, ...this.cityForm.value };
    this.api.updateCity(this.cityId, payload).subscribe({
      next: () => {
        this.loading = false;
        this.msg.add({ severity: 'success', summary: 'Updated', detail: 'City updated successfully' });
        this.router.navigate(['/pages/city-list']);
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Update failed';
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/pages/city-list']);
  }
}
