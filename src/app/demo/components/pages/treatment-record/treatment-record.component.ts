import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-treatment-record',
  templateUrl: './treatment-record.component.html',
  styleUrls: ['./treatment-record.component.scss']
})
export class TreatmentRecordComponent implements OnInit {
  form!: FormGroup;
  appointments: any[] = [];
  loading = false;
  saving = false;
  savingInvoice = false;
  treatmentSaved = false;
  treatmentMastersLoading = false;
  treatmentMasters: any[] = [];
  readonly treatmentDurations = Array.from({ length: 12 }, (_, index) => ({ label: `${index + 1} hour(s)`, value: `${index + 1}` }));
  invoiceError = '';
  private savedAppointmentId = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: AuthService,
    private messages: MessageService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      appointmentId: ['', Validators.required],
      treatments: this.fb.array([this.createTreatmentCard()]),
      diagnosis: ['', Validators.required],
      notes: [''],
      followUpDate: ['']
    });
    this.loadAppointments();
    this.loadTreatmentMasters();
  }

  get treatments(): FormArray { return this.form.get('treatments') as FormArray; }

  private createTreatmentCard(): FormGroup {
    return this.fb.group({ treatmentMasterId: ['', Validators.required], duration: [''], description: [''] });
  }

  addTreatment(): void { this.treatments.push(this.createTreatmentCard()); }
  removeTreatment(index: number): void {
    if (this.treatments.length > 1) this.treatments.removeAt(index);
  }

  treatmentFor(index: number): any {
    const id = this.treatments.at(index)?.get('treatmentMasterId')?.value;
    return this.treatmentMasters.find(treatment => treatment._id === id);
  }

  onTreatmentSelected(index: number): void {
    const treatment = this.treatmentFor(index);
    const card = this.treatments.at(index);
    if (!treatment || !card) return;
    if (treatment.description) card.patchValue({ description: treatment.description }, { emitEvent: false });
    const duration = treatment.durationHours ?? treatment.estimatedDuration ?? treatment.duration;
    if (duration != null && duration !== '') card.patchValue({ duration: String(duration).replace(/\s*hour\(s\)$/i, '') }, { emitEvent: false });
  }

  treatmentComponents(index: number): any[] {
    const value = this.treatmentFor(index)?.components;
    return Array.isArray(value) ? value : [];
  }

  componentsSummary(index: number): string {
    return this.treatmentComponents(index).map(component => component?.name || component).join(', ');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const treatments = (value.treatments || []).filter((item: any) => item.treatmentMasterId);
    const treatmentMasterIds: string[] = treatments.map((item: any) => item.treatmentMasterId);
    if (!treatmentMasterIds.length || this.treatments.invalid) {
      this.treatments.markAllAsTouched();
      return;
    }
    const payload = {
      appointmentId: value.appointmentId?.value || value.appointmentId,
      treatmentMasterIds,
      treatments: treatments.map((item: any) => ({
        treatmentMasterId: item.treatmentMasterId,
        duration: item.duration,
        description: item.description
      })),
      diagnosis: value.diagnosis,
      notes: value.notes,
      followUpDate: value.followUpDate || undefined
    };
    this.saving = true;
    this.api.createTreatmentRecord(payload).subscribe({
      next: () => {
        this.saving = false;
        this.treatmentSaved = true;
        this.savedAppointmentId = payload.appointmentId;
        this.form.disable();
        this.issueInvoice();
      },
      error: (error: any) => {
        this.saving = false;
        this.messages.add({ severity: 'error', summary: 'Could not save treatment', detail: error?.error?.message || 'Please check the appointment and try again.' });
      }
    });
  }

  issueInvoice(): void {
    if (!this.savedAppointmentId || this.savingInvoice) return;
    this.savingInvoice = true;
    this.invoiceError = '';
    this.api.createInvoice({ appointmentId: this.savedAppointmentId, gstRate: 0 }).subscribe({
      next: (response: any) => this.finishInvoice(response?.data),
      error: (error: any) => {
        const existing = error?.error?.data;
        if (error?.status === 409 && existing?.invoiceNumber) {
          this.finishInvoice(existing);
          return;
        }
        this.savingInvoice = false;
        this.invoiceError = error?.error?.message || 'Treatment was saved, but the invoice could not be issued. Retry to continue.';
        this.messages.add({ severity: 'warn', summary: 'Treatment saved', detail: this.invoiceError });
      }
    });
  }

  private finishInvoice(invoice: any): void {
    this.savingInvoice = false;
    this.messages.add({
      severity: 'success',
      summary: 'Treatment and invoice saved',
      detail: `${invoice?.invoiceNumber || 'Invoice'} · ${Number(invoice?.totalAmount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`
    });
    this.router.navigate(['/pages/invoice-list']);
  }

  cancel(): void { this.router.navigate(['/pages/appointment-list']); }

  private loadAppointments(): void {
    this.loading = true;
    this.api.getAppointmentList({ page: 1, limit: 100 }).subscribe({
      next: (response: any) => {
        this.appointments = (response?.data || [])
          .filter((item: any) => !item.treatmentId && item.status !== 'CANCELLED')
          .map((item: any) => {
            const patient = item.patientId && typeof item.patientId === 'object' ? item.patientId : {};
            const name = patient.name || [patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Patient';
            return { label: `${name} · ${new Date(item.date).toLocaleDateString()} ${item.time || ''}`, value: item._id };
          });
        const appointmentId = this.route.snapshot.queryParamMap.get('appointmentId');
        if (appointmentId) this.form.patchValue({ appointmentId });
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: 'Appointments unavailable', detail: error?.error?.message || 'Unable to load appointments.' });
      }
    });
  }

  private loadTreatmentMasters(): void {
    this.treatmentMastersLoading = true;
    this.api.getTreatmentList({ status: 'ACTIVE', limit: 100 }).subscribe({
      next: (response: any) => {
        this.treatmentMasters = (response?.data || []).filter((treatment: any) =>
          typeof treatment.price === 'number' && Number.isFinite(treatment.price) && treatment.price >= 0
        ).map((treatment: any) => ({
          ...treatment,
          label: `${treatment.name} · ${treatment.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`
        }));
        this.treatmentMastersLoading = false;
      },
      error: () => {
        this.treatmentMastersLoading = false;
        this.messages.add({ severity: 'error', summary: 'Treatments unavailable', detail: 'Unable to load priced active treatments for invoice creation.' });
      }
    });
  }

}
