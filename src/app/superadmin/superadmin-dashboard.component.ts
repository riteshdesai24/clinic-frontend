import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { catchError, concatMap, map, toArray } from 'rxjs/operators';
import { firstValueFrom, from, of } from 'rxjs';
import { AdminResource, SuperAdminApiService } from './superadmin-api.service';

interface ResourceField { key: string; label: string; type?: string; required?: boolean; }
interface ResourceConfig { title: string; singular: string; description: string; columns: string[]; fields: ResourceField[]; }
@Component({ selector: 'app-superadmin-dashboard', templateUrl: './superadmin-dashboard.component.html', styleUrls: ['./superadmin.scss'] })
export class SuperAdminDashboardComponent implements OnInit {
  readonly resources: Record<AdminResource, ResourceConfig> = {
    clinics: { title: 'Clinic management', singular: 'Clinic', description: 'Review clinic accounts and update their contact information.', columns: ['clinicName', 'email', 'phone', 'plan', 'isActive'], fields: [{ key: 'clinicName', label: 'Clinic name', required: true }, { key: 'email', label: 'Email', type: 'email', required: true }, { key: 'password', label: 'Initial password (required when creating)', type: 'password' }, { key: 'phone', label: 'Phone' }, { key: 'plan', label: 'Membership plan', type: 'select', required: true }] },
    countries: { title: 'Country master', singular: 'Country', description: 'Maintain the countries available throughout the clinic platform.', columns: ['name', 'code', 'isActive'], fields: [{ key: 'name', label: 'Country name', required: true }, { key: 'code', label: 'Country code' }] },
    states: { title: 'State master', singular: 'State', description: 'Organize states and link each one to its country. Import country IDs or country names.', columns: ['name', 'country', 'isActive'], fields: [{ key: 'name', label: 'State name', required: true }, { key: 'country', label: 'Country ID or name', required: true }] },
    cities: { title: 'City master', singular: 'City', description: 'Maintain cities and associate them with their state. Import state IDs or state names.', columns: ['name', 'state', 'isActive'], fields: [{ key: 'name', label: 'City name', required: true }, { key: 'state', label: 'State ID or name', required: true }] },
    memberships: { title: 'Membership plans', singular: 'Membership', description: 'Set the plan name, description, included features, price, duration, and staff access.', columns: ['name', 'description', 'price', 'durationMonths', 'staffAllowed', 'features'], fields: [{ key: 'name', label: 'Membership name', required: true }, { key: 'description', label: 'Plan description', type: 'textarea' }, { key: 'features', label: 'Included points (one per line)', type: 'textarea' }, { key: 'price', label: 'Price', type: 'number', required: true }, { key: 'durationMonths', label: 'Duration (months)', type: 'number', required: true }, { key: 'staffAllowed', label: 'Allow staff accounts', type: 'checkbox' }] },
    treatmentmasters: { title: 'Treatment master', singular: 'Treatment', description: 'Manage the platform treatment catalogue used by clinics.', columns: ['name', 'description', 'duration', 'price', 'status'], fields: [{ key: 'name', label: 'Treatment name', required: true }, { key: 'description', label: 'Description' }, { key: 'duration', label: 'Duration (minutes)', type: 'number' }, { key: 'price', label: 'Price', type: 'number' }, { key: 'status', label: 'Status (ACTIVE or INACTIVE)' }] },
    labmasters: { title: 'Lab master', singular: 'Lab', description: 'Manage laboratories and their contact details.', columns: ['name', 'code', 'email', 'phone', 'isActive'], fields: [{ key: 'name', label: 'Lab name', required: true }, { key: 'code', label: 'Lab code' }, { key: 'description', label: 'Description' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Address' }] }
  };
  readonly keys = Object.keys(this.resources) as AdminResource[];
  selected: AdminResource = 'clinics';
  rows: any[] = [];
  form: any;
  editingId = '';
  showForm = false;
  loading = false;
  importing = false;
  importProgress = '';
  membershipOptions: string[] = [];
  membershipOptionsLoading = false;
  error = '';
  notice = '';
  constructor(private api: SuperAdminApiService, private fb: FormBuilder, private router: Router, private route: ActivatedRoute) { this.form = this.fb.group({}); }
  ngOnInit(): void {
    this.route.data.subscribe(data => {
      const resource = data['resource'] as AdminResource;
      if (resource && resource !== this.selected) {
        this.selected = resource;
        this.closeForm();
        this.notice = '';
        this.load();
      } else if (resource && !this.rows.length) {
        this.selected = resource;
        this.load();
      }
    });
  }
  select(resource: AdminResource): void { this.router.navigate(['/superadmin', resource]); }
  get config(): ResourceConfig { return this.resources[this.selected]; }
  get title(): string { return this.config.title; }
  get columns(): string[] {
    const configured = this.config.columns.filter(column => this.rows.some(row => row?.[column] !== undefined));
    return configured.length ? configured : (this.rows.length ? Object.keys(this.rows[0]).filter(key => !['_id', '__v', 'password'].includes(key)).slice(0, 5) : this.config.columns);
  }
  load(): void {
    this.loading = true; this.error = '';
    if (this.selected === 'clinics') this.loadMembershipOptions();
    this.api.list(this.selected).subscribe({
      next: (response) => { const data = response?.data ?? response?.items ?? response; this.rows = Array.isArray(data) ? data : (data ? [data] : []); },
      error: (err) => { this.rows = []; this.error = err?.error?.message || `Could not load ${this.title.toLowerCase()}.`; },
      complete: () => this.loading = false
    });
  }
  private loadMembershipOptions(): void {
    this.membershipOptionsLoading = true;
    this.api.list('memberships').subscribe({
      next: response => { this.membershipOptions = this.unwrapList(response).map(record => String(record?.name || '')).filter(Boolean); },
      error: () => { this.membershipOptions = []; this.membershipOptionsLoading = false; },
      complete: () => { this.membershipOptionsLoading = false; }
    });
  }
  add(): void { this.editingId = ''; this.form = this.makeForm({}); this.showForm = true; this.notice = ''; }
  edit(row: any): void { this.editingId = String(row?._id || row?.id || ''); this.form = this.makeForm(row); this.showForm = true; this.notice = ''; }
  private makeForm(row: any): any {
    const controls: Record<string, any> = {};
    this.config.fields.forEach(field => {
      const value = field.key === 'features' && Array.isArray(row?.[field.key]) ? row[field.key].join('\n') : (row?.[field.key] ?? '');
      const validators = field.required && (field.key !== 'password' || !this.editingId) ? [Validators.required] : [];
      controls[field.key] = [value, validators];
    });
    return this.fb.group(controls);
  }
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload = { ...this.form.value };
    Object.keys(payload).forEach(key => { if (payload[key] === '' || payload[key] === null) delete payload[key]; });
    if (this.selected === 'memberships') {
      payload.staffAllowed = Boolean(payload.staffAllowed);
      if (typeof payload.features === 'string') {
        payload.features = payload.features.split(/[\n,;]+/).map((feature: string) => feature.trim()).filter(Boolean);
      }
    }
    if (this.selected === 'clinics' && !payload.password) delete payload.password;
    const request = this.editingId ? this.api.update(this.selected, this.editingId, payload) : this.api.create(this.selected, payload);
    this.loading = true;
    request.subscribe({ next: () => { this.notice = `${this.config.singular} ${this.editingId ? 'updated' : 'created'}.`; this.closeForm(); this.load(); }, error: (err) => { this.error = err?.error?.message || `Could not save ${this.config.singular.toLowerCase()}.`; this.loading = false; } });
  }
  async importExcel(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.error = '';
    this.notice = '';
    this.importing = true;
    this.importProgress = 'Reading workbook…';
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      const rows = rawRows.map(row => this.normalizeImportRow(row)).filter(row => Object.values(row).some(value => value !== '' && value !== undefined));
      if (!rows.length) throw new Error('The first worksheet has no data rows.');
      const payloads = await this.prepareImportRows(rows);
      this.importProgress = `Importing 0 of ${payloads.length} rows…`;
      const results = await firstValueFrom(from(payloads).pipe(
        concatMap((payload, index) => this.api.create(this.selected, payload).pipe(
          map(() => ({ row: index + 2, success: true, message: '' })),
          catchError(err => of({ row: index + 2, success: false, message: err?.error?.message || 'Request failed' }))
        )),
        toArray()
      ));
      const succeeded = results.filter(result => result.success).length;
      const failed = results.filter(result => !result.success);
      this.notice = `${succeeded} ${this.config.singular.toLowerCase()} record(s) imported${failed.length ? `; ${failed.length} failed (Excel row${failed.length === 1 ? '' : 's'} ${failed.slice(0, 8).map(result => `${result.row}: ${result.message}`).join('; ')}${failed.length > 8 ? '; more errors omitted' : ''})` : '.'}`;
      if (succeeded) this.load();
    } catch (err: any) {
      this.error = err?.message || 'Could not read this Excel file.';
    } finally {
      this.importing = false;
      this.importProgress = '';
    }
  }
  private normalizeImportRow(row: Record<string, any>): Record<string, any> {
    const normalized = new Map<string, any>();
    for (const [header, value] of Object.entries(row)) {
      const key = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      normalized.set(key, value);
    }
    const aliases: Record<string, string[]> = {
      clinicName: ['clinic', 'name'], country: ['countryid'], state: ['stateid'],
      price: ['amount'], staffAllowed: ['staff', 'staffaccountsallowed'], duration: ['durationminutes']
    };
    const result: Record<string, any> = {};
    for (const field of this.config.fields) {
      const headers = [field.key, ...(aliases[field.key] || [])].map(key => key.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const matched = headers.find(key => normalized.has(key));
      if (matched) result[field.key] = normalized.get(matched);
    }
    return result;
  }
  private async prepareImportRows(rows: Record<string, any>[]): Promise<Record<string, any>[]> {
    const payloads = rows.map(row => {
      const payload = { ...row };
      for (const key of ['price', 'duration', 'durationMonths']) if (payload[key] !== '' && payload[key] !== undefined) payload[key] = Number(payload[key]);
      if (payload['staffAllowed'] !== undefined) payload['staffAllowed'] = this.toBoolean(payload['staffAllowed']);
      if (payload['isActive'] !== undefined) payload['isActive'] = this.toBoolean(payload['isActive']);
      if (this.selected === 'memberships' && typeof payload['features'] === 'string') {
        payload['features'] = payload['features'].split(/[\n,;]+/).map((feature: string) => feature.trim()).filter(Boolean);
      }
      return payload;
    });
    if (this.selected === 'states') {
      const countries = this.unwrapList(await firstValueFrom(this.api.list('countries')));
      const countryIds = new Map(countries.map(country => [String(country.name).toLowerCase(), country._id || country.id]));
      payloads.forEach(row => { const value = String(row['country'] || ''); row['country'] = countryIds.get(value.toLowerCase()) || value; });
    }
    if (this.selected === 'cities') {
      const states = this.unwrapList(await firstValueFrom(this.api.list('states')));
      const stateIds = new Map(states.map(state => [String(state.name).toLowerCase(), state._id || state.id]));
      payloads.forEach(row => { const value = String(row['state'] || ''); row['state'] = stateIds.get(value.toLowerCase()) || value; });
    }
    return payloads;
  }
  private unwrapList(response: any): any[] {
    const data = response?.data ?? response?.items ?? response;
    return Array.isArray(data) ? data : [];
  }
  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    return ['true', 'yes', '1', 'allowed', 'active'].includes(String(value).trim().toLowerCase());
  }
  remove(row: any): void {
    const id = String(row?._id || row?.id || '');
    if (!id) { this.error = 'This record has no id and cannot be deleted.'; return; }
    if (!window.confirm(`Delete this ${this.config.singular.toLowerCase()}?`)) return;
    this.loading = true;
    this.api.delete(this.selected, id).subscribe({ next: () => { this.notice = `${this.config.singular} deleted.`; this.load(); }, error: (err) => { this.error = err?.error?.message || `Could not delete ${this.config.singular.toLowerCase()}.`; this.loading = false; } });
  }
  closeForm(): void { this.showForm = false; this.editingId = ''; }
  value(row: any, column: string): string { const value = row?.[column]; return Array.isArray(value) ? value.join(', ') : (value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')); }
  logout(): void { localStorage.removeItem('token'); sessionStorage.removeItem('token'); localStorage.removeItem('user'); sessionStorage.removeItem('user'); this.router.navigate(['/superadmin/login']); }
}
