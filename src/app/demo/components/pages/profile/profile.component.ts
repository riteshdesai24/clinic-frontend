import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';
import { SuperAdminApiService } from 'src/app/superadmin/superadmin-api.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  profile: any;
  fields: string[] = [];
  loading = true;
  saving = false;
  savingPassword = false;
  clinicLogo = '';
  logoError = '';
  countries: any[] = [];
  filteredCountries: any[] = [];
  filteredStates: any[] = [];
  filteredCities: any[] = [];
  private stateRecords: any[] = [];
  private cityRecords: any[] = [];
  private availableStates: any[] = [];
  private availableCities: any[] = [];

  private readonly editableFields: Record<string, string[]> = {
    ADMIN: ['clinicName', 'phone', 'email', 'address1', 'address2', 'address3', 'country', 'state', 'city', 'pincode'],
    STAFF: ['staffname', 'phone', 'email', 'address1', 'address2', 'address3', 'country', 'state', 'city', 'pincode'],
    DOCTOR: ['staffname', 'phone', 'email', 'specialization', 'address1', 'address2', 'address3', 'country', 'state', 'city', 'pincode']
  };

  constructor(
    private fb: FormBuilder,
    private api: AuthService,
    private msg: MessageService,
    private router: Router,
    private masterApi: SuperAdminApiService
  ) {}

  ngOnInit(): void {
    const strongPassword = Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/);
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, strongPassword]],
      confirmPassword: ['', Validators.required]
    });
    this.loadLocationMasters();
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.api.getCurrentProfile().subscribe({
      next: (response: any) => {
        this.profile = response?.data || {};
        this.clinicLogo = this.profile.clinicLogo || this.profile.logoUrl || this.profile.logo || this.readClinicLogo();
        this.fields = this.editableFields[this.profile.role] || [];
        const controls: Record<string, any> = {};
        this.fields.forEach(field => {
          const validators = field === 'email' || field === 'clinicName' || field === 'staffname'
            ? [Validators.required]
            : [];
          if (field === 'email') validators.push(Validators.email);
          controls[field] = [this.profile[field] || '', validators];
        });
        this.profileForm = this.fb.group(controls);
        this.normalizeLocationValues();
        this.updateLocationOptions(this.profileForm.get('country')?.value || '');
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Profile unavailable', detail: error?.error?.message || 'Unable to load your profile.' });
      }
    });
  }

  save(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const formValue = this.profileForm.getRawValue();
    const changes = {
      ...formValue,
      country: this.masterId(formValue.country, this.countries),
      state: this.masterId(formValue.state, this.stateRecords),
      city: this.masterId(formValue.city, this.cityRecords),
      clinicLogo: this.clinicLogo
    };
    this.api.updateCurrentProfile(changes).subscribe({
      next: (response: any) => {
        this.profile = { ...this.profile, ...changes, ...(response?.data || {}) };
        this.persistProfile();
        this.saving = false;
        this.msg.add({ severity: 'success', summary: 'Saved', detail: 'Your profile has been updated.' });
      },
      error: (error: any) => {
        this.saving = false;
        this.msg.add({ severity: 'error', summary: 'Could not save', detail: error?.error?.message || 'Unable to update your profile.' });
      }
    });
  }

  onClinicLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.logoError = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|gif|webp|svg\+xml)$/.test(file.type) || file.size > 10 * 1024 * 1024) {
      this.logoError = 'Choose an SVG, PNG, JPEG, GIF, or WebP image under 10 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 600 / image.width, 300 / image.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) { this.logoError = 'Could not prepare this image. Please try another file.'; return; }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        this.clinicLogo = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86);
      };
      image.onerror = () => { this.logoError = 'Could not read this image. Please try another file.'; };
      image.src = String(reader.result || '');
    };
    reader.onerror = () => { this.logoError = 'Could not read this image. Please try another file.'; };
    reader.readAsDataURL(file);
  }

  removeClinicLogo(): void { this.clinicLogo = ''; this.logoError = ''; }

  private readClinicLogo(): string {
    try {
      const clinic = JSON.parse(localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}');
      return clinic.clinicLogo || clinic.logoUrl || clinic.logo || '';
    } catch { return ''; }
  }

  cancel(): void {
    this.router.navigate(['/']);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.passwordForm.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }
    this.savingPassword = true;
    this.api.changePassword(oldPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordForm.reset();
        this.msg.add({ severity: 'success', summary: 'Password updated', detail: 'Your password has been changed.' });
      },
      error: (error: any) => {
        this.savingPassword = false;
        this.msg.add({ severity: 'error', summary: 'Could not update password', detail: error?.error?.message || 'Unable to change your password.' });
      }
    });
  }

  label(field: string): string {
    const addressLine = /^address([123])$/.exec(field);
    if (addressLine) return `Address Line ${addressLine[1]}`;
    if (field === 'staffname') return 'Name';
    if (field === 'pincode') return 'Pincode';
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, value => value.toUpperCase());
  }

  get addressFields(): string[] {
    return ['address1', 'address2', 'address3', 'country', 'state', 'city', 'pincode']
      .filter(field => !!this.profileForm?.get(field));
  }

  get detailsFields(): string[] {
    return this.fields.filter(field => !this.addressFields.includes(field));
  }

  searchCountries(event: { query: string }): void {
    const query = (event.query || '').toLowerCase();
    this.filteredCountries = this.countries.filter(country => country.name.toLowerCase().includes(query));
  }

  onCountryChange(country: any): void {
    this.updateLocationOptions(country);
    this.profileForm.get('state')?.setValue('');
    this.profileForm.get('city')?.setValue('');
    this.availableCities = [];
    this.filteredCities = [];
  }

  onStateChange(state: any): void {
    const stateRecord = this.findRecord(this.stateRecords, state);
    this.availableCities = this.cityRecords
      .filter(city => this.sameReference(city.state ?? city.stateId, stateRecord))
      .filter(city => !!city.name);
    this.filteredCities = [...this.availableCities];
    this.profileForm.get('city')?.setValue('');
  }

  searchStates(event: { query: string }): void {
    this.filteredStates = this.availableStates.filter(value => String(value.name || '').toLowerCase().includes((event.query || '').toLowerCase()));
  }

  searchCities(event: { query: string }): void {
    this.filteredCities = this.availableCities.filter(value => String(value.name || '').toLowerCase().includes((event.query || '').toLowerCase()));
  }

  private updateLocationOptions(country: any): void {
    const countryRecord = this.findRecord(this.countries, country);
    this.availableStates = this.stateRecords
      .filter(state => this.sameReference(state.country ?? state.countryId, countryRecord))
      .filter(state => !!state.name);
    this.filteredStates = [...this.availableStates];
    const currentState = this.profileForm?.get('state')?.value;
    const stateRecord = currentState ? this.findRecord(this.stateRecords, currentState) : null;
    this.availableCities = stateRecord
      ? this.cityRecords.filter(city => this.sameReference(city.state ?? city.stateId, stateRecord) && !!city.name)
      : [];
    this.filteredCities = [...this.availableCities];
  }

  private loadLocationMasters(): void {
    forkJoin({
      countries: this.masterApi.list('countries').pipe(catchError(() => of([]))),
      states: this.masterApi.list('states').pipe(catchError(() => of([]))),
      cities: this.masterApi.list('cities').pipe(catchError(() => of([])))
    }).subscribe(({ countries, states, cities }) => {
      this.countries = this.unwrapMasterList(countries);
      this.stateRecords = this.unwrapMasterList(states);
      this.cityRecords = this.unwrapMasterList(cities);
      this.filteredCountries = [...this.countries];
      if (this.profileForm) {
        this.normalizeLocationValues();
        this.updateLocationOptions(this.profileForm.get('country')?.value || '');
      }
    });
  }

  private unwrapMasterList(response: any): any[] {
    const data = response?.data ?? response?.items ?? response;
    return Array.isArray(data) ? data.filter(record => record?.isActive !== false) : [];
  }

  private findRecord(records: any[], value: any): any {
    const candidate = value && typeof value === 'object' ? value : null;
    const key = String(candidate?._id ?? candidate?.id ?? candidate?.name ?? value ?? '').toLowerCase();
    return records.find(record => [record?._id, record?.id, record?.name].some(item => String(item ?? '').toLowerCase() === key)) || candidate;
  }

  private sameReference(reference: any, target: any): boolean {
    if (!reference || !target) return false;
    const referenceKey = String(typeof reference === 'object' ? reference._id ?? reference.id ?? reference.name : reference).toLowerCase();
    return [target._id, target.id, target.name].some(item => String(item ?? '').toLowerCase() === referenceKey);
  }

  private masterId(value: any, records: any[]): any {
    if (!value) return value;
    const record = this.findRecord(records, value);
    return record ? (record._id ?? record.id ?? value) : value;
  }

  private normalizeLocationValues(): void {
    for (const [field, records] of [['country', this.countries], ['state', this.stateRecords], ['city', this.cityRecords]] as [string, any[]][]) {
      const control = this.profileForm.get(field);
      const value = control?.value;
      if (value) control?.setValue(this.findRecord(records, value) || value, { emitEvent: false });
    }
  }

  private persistProfile(): void {
    const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
    try {
      const user = JSON.parse(storage.getItem('user') || '{}');
      storage.setItem('user', JSON.stringify({ ...user, ...this.profile }));
      const clinicStorage = localStorage.getItem('clinic') ? localStorage : sessionStorage;
      const clinic = JSON.parse(clinicStorage.getItem('clinic') || '{}');
      clinicStorage.setItem('clinic', JSON.stringify({
        ...clinic,
        ...(this.profile.role === 'ADMIN' ? { clinicName: this.profile.clinicName } : {}),
        clinicLogo: this.clinicLogo
      }));
      window.dispatchEvent(new Event('clinic-profile-updated'));
    } catch {
      // The server profile remains authoritative if old browser storage is malformed.
    }
  }
}
