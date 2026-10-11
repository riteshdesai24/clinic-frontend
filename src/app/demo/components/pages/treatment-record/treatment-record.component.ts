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
  invoiceError = '';
  readonly gstRate = 18;
  private savedAppointmentId = '';
  private savedDiscountAmount = 0;

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
      treatmentMasterIds: [[], Validators.required],
      discountAmount: [0, [Validators.min(0)]],
      diagnosis: ['', Validators.required],
      notes: [''],
      followUpDate: [''],
      medicines: this.fb.array([])
    });
    this.loadAppointments();
    this.loadTreatmentMasters();
  }

  get medicines(): FormArray { return this.form.get('medicines') as FormArray; }

  addMedicine(): void {
    this.medicines.push(this.fb.group({ name: ['', Validators.required], dosage: [''], frequency: [''], duration: [''] }));
  }

  removeMedicine(index: number): void { this.medicines.removeAt(index); }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const treatmentMasterIds: string[] = Array.isArray(value.treatmentMasterIds) ? value.treatmentMasterIds : [];
    const discountAmount = Number(value.discountAmount || 0);
    if (!treatmentMasterIds.length) {
      this.form.get('treatmentMasterIds')?.markAsTouched();
      return;
    }
    if (discountAmount > this.selectedTreatmentPrice) {
      this.form.get('discountAmount')?.setErrors({ exceedsSubtotal: true });
      this.form.get('discountAmount')?.markAsTouched();
      return;
    }
    const payload = {
      appointmentId: value.appointmentId?.value || value.appointmentId,
      treatmentMasterIds,
      diagnosis: value.diagnosis,
      notes: value.notes,
      followUpDate: value.followUpDate || undefined,
      medicines: value.medicines.filter((medicine: any) => medicine.name?.trim())
    };
    this.saving = true;
    this.api.createTreatmentRecord(payload).subscribe({
      next: () => {
        this.saving = false;
        this.treatmentSaved = true;
        this.savedAppointmentId = payload.appointmentId;
        this.savedDiscountAmount = discountAmount;
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
    this.api.createInvoice({ appointmentId: this.savedAppointmentId, gstRate: this.gstRate, discountAmount: this.savedDiscountAmount }).subscribe({
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

  get selectedTreatmentPrice(): number {
    return this.selectedTreatments.reduce((sum, treatment) => sum + Number(treatment.price || 0), 0);
  }

  get selectedTreatments(): any[] {
    const ids = this.form?.get('treatmentMasterIds')?.value;
    return Array.isArray(ids) ? this.treatmentMasters.filter(treatment => ids.includes(treatment._id)) : [];
  }

  get discountAmount(): number {
    return Math.max(0, Number(this.form?.get('discountAmount')?.value || 0));
  }

  get taxableAmount(): number {
    return Math.max(0, this.selectedTreatmentPrice - this.discountAmount);
  }

  get gstAmount(): number {
    return this.taxableAmount * this.gstRate / 100;
  }

  get invoiceTotal(): number {
    return this.taxableAmount + this.gstAmount;
  }

  get discountExceedsSubtotal(): boolean {
    return this.discountAmount > this.selectedTreatmentPrice;
  }
}
