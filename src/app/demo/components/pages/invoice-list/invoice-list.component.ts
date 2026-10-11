import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

interface InvoicePaymentDraft {
  amount: number;
  method: string;
  reference: string;
}

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  invoices: any[] = [];
  filteredInvoices: any[] = [];
  invoicePage = 1;
  readonly invoicePageSize = 10;
  selectedStatus = 'ALL';
  selectedPeriod: 'week' | 'month' = 'week';
  readonly invoiceStatuses = ['ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID'];
  loading = false;
  savingPayment = false;
  error = '';
  selectedInvoiceId = '';
  paymentMethods = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'ONLINE', 'OTHER'];
  paymentDraft: InvoicePaymentDraft = { amount: 0, method: 'CASH', reference: '' };
  pdfLoadingId = '';
  pdfError = '';
  pdfUrl = '';
  safePdfUrl: SafeResourceUrl | null = null;
  pdfInvoiceNumber = '';
  isAdmin = false;
  isDoctor = false;
  doctorOptions: { label: string; value: string }[] = [];
  selectedDoctorId = '';
  private currentUser: any = {};
  private currentDoctorIds = new Set<string>();
  private patientById = new Map<string, any>();

  constructor(private api: AuthService, private messages: MessageService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    try {
      this.currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      const role = String(this.currentUser.role || '').toUpperCase();
      this.isAdmin = role === 'ADMIN';
      this.isDoctor = role === 'DOCTOR';
      [this.currentUser.doctorId, this.currentUser.staffId, this.currentUser._id, this.currentUser.id, this.currentUser.userId]
        .forEach(id => { const value = this.idOf(id); if (value) this.currentDoctorIds.add(value); });
    } catch {
      this.isAdmin = false;
      this.isDoctor = false;
    }
    if (this.isAdmin || this.isDoctor) this.loadDoctors();
    this.loadPatientNames();
    this.loadInvoices();
  }

  private loadPatientNames(): void {
    this.api.getPatientList().subscribe({
      next: (response: any) => {
        const patients = Array.isArray(response?.data) ? response.data : response?.data?.patients || [];
        patients.forEach((patient: any) => {
          const id = this.idOf(patient);
          if (id) this.patientById.set(id, patient);
        });
        this.invoices = this.invoices.map(invoice => this.toListItem(invoice));
        this.applyDoctorFilter();
      }
    });
  }

  private loadDoctors(): void {
    this.api.getDoctorList(undefined, 100).subscribe({
      next: (res: any) => {
        const records = Array.isArray(res?.data) ? res.data : res?.data?.doctors || res?.doctors || [];
        this.doctorOptions = records.map((doctor: any) => ({
          label: doctor.staffname || doctor.name || [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || 'Doctor',
          value: this.idOf(doctor)
        })).filter((doctor: any) => doctor.value);
        if (this.isDoctor) {
          const email = String(this.currentUser.email || '').toLowerCase();
          const name = this.userDoctorName().toLowerCase();
          const own = records.find((doctor: any) =>
            (email && String(doctor.email || '').toLowerCase() === email) ||
            (name && String(doctor.staffname || doctor.name || '').toLowerCase() === name)
          );
          const ownId = this.idOf(own);
          if (ownId) this.currentDoctorIds.add(ownId);
        }
        this.applyDoctorFilter();
      },
      error: () => { /* The authenticated invoice response remains available. */ }
    });
  }

  onDoctorFilterChange(event: Event): void {
    this.selectedDoctorId = (event.target as HTMLSelectElement).value;
    this.applyDoctorFilter();
  }

  onStatusFilterChange(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.applyDoctorFilter();
  }

  onPeriodFilterChange(event: Event): void {
    this.selectedPeriod = (event.target as HTMLSelectElement).value === 'month' ? 'month' : 'week';
    this.loadInvoices();
  }

  onInvoicePageChange(page: number): void {
    this.invoicePage = page;
  }

  ngOnDestroy(): void {
    this.releasePdfUrl();
  }

  viewPdf(invoice: any): void {
    if (!invoice?._id) return;
    this.pdfLoadingId = invoice._id;
    this.pdfError = '';
    this.api.getInvoicePdf(invoice._id).subscribe({
      next: (blob: Blob) => {
        this.releasePdfUrl();
        if (!blob.size || (blob.type && blob.type !== 'application/pdf' && blob.type !== 'application/octet-stream')) {
          this.pdfError = 'The server did not return a valid PDF.';
          this.pdfLoadingId = '';
          return;
        }
        this.pdfUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl);
        this.pdfInvoiceNumber = invoice.invoiceNumber || 'Invoice';
        this.pdfLoadingId = '';
      },
      error: (error: any) => {
        this.pdfError = error?.error?.message || 'Could not load this invoice PDF.';
        this.pdfLoadingId = '';
      }
    });
  }

  closePdf(): void {
    this.releasePdfUrl();
    this.pdfInvoiceNumber = '';
  }

  private releasePdfUrl(): void {
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
    this.pdfUrl = '';
    this.safePdfUrl = null;
  }

  loadInvoices(): void {
    this.loading = true;
    this.error = '';
    const params: Record<string, string | number> = { page: 1, limit: 100, period: this.selectedPeriod };
    if (this.isAdmin && this.selectedDoctorId) params['doctorId'] = this.selectedDoctorId;
    this.api.getInvoices(params).subscribe({
      next: (response: any) => {
        const records = Array.isArray(response?.data) ? response.data : response?.data?.invoices || [];
        this.api.getAppointmentList().subscribe({
          next: (appointmentResponse: any) => {
            const appointments = Array.isArray(appointmentResponse?.data)
              ? appointmentResponse.data
              : appointmentResponse?.data?.appointments || [];
            const byId = new Map<string, any>(appointments.map((appointment: any) => [this.idOf(appointment), appointment]));
            this.invoices = records.map((invoice: any) => {
              const appointmentId = this.idOf(invoice.appointmentId || invoice.appointment);
              return this.toListItem(invoice, byId.get(appointmentId));
            });
            this.applyDoctorFilter();
            this.loading = false;
          },
          error: () => {
            this.invoices = records.map((invoice: any) => this.toListItem(invoice));
            this.applyDoctorFilter();
            this.loading = false;
          }
        });
      },
      error: (error: any) => {
        this.error = error?.error?.message || 'Could not load invoices.';
        this.loading = false;
      }
    });
  }

  private toListItem(invoice: any, appointmentFallback?: any): any {
    const appointment = this.asRecord(invoice.appointmentId) || this.asRecord(invoice.appointment) || appointmentFallback || {};
    const patient = this.asRecord(invoice.patientId) || this.asRecord(invoice.patient) ||
      this.asRecord(appointment.patientId) || this.asRecord(appointment.patient) || {};
    const savedPatient = this.patientById.get(this.idOf(invoice.patientId || invoice.patient || appointment.patientId || appointment.patient)) || {};
    const doctor = this.asRecord(invoice.doctorId) || this.asRecord(invoice.doctor) ||
      this.asRecord(appointment.doctorId) || this.asRecord(appointment.doctor) || {};
    return {
      ...invoice,
      patientDisplayName: patient.name || patient.patientName || [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ') ||
        savedPatient.name || savedPatient.patientName || [savedPatient.firstName, savedPatient.middleName, savedPatient.lastName].filter(Boolean).join(' ') ||
        patient.patientName || invoice.patientName || appointment.patientName || 'Patient',
      patientDisplayPhone: patient.phone || savedPatient.phone || invoice.patientPhone || appointment.patientPhone || '',
      doctorDisplayName: doctor.staffname || doctor.name || [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') ||
        invoice.doctorName || appointment.doctorName || 'Doctor',
      doctorIdValue: this.idOf(invoice.doctorId || invoice.doctor || appointment.doctorId || appointment.doctor)
    };
  }

  private applyDoctorFilter(): void {
    this.invoicePage = 1;
    this.filteredInvoices = this.invoices.filter(invoice => {
      const matchesDoctor = this.isAdmin
        ? !this.selectedDoctorId || invoice.doctorIdValue === this.selectedDoctorId
        : !this.isDoctor || this.belongsToCurrentDoctor(invoice);
      const matchesStatus = this.selectedStatus === 'ALL' || String(invoice.status || '').toUpperCase() === this.selectedStatus;
      return matchesDoctor && matchesStatus;
    });
  }

  get visibleInvoices(): any[] {
    const start = (this.invoicePage - 1) * this.invoicePageSize;
    return this.filteredInvoices.slice(start, start + this.invoicePageSize);
  }

  private belongsToCurrentDoctor(invoice: any): boolean {
    const doctor = this.asRecord(invoice.doctorId) || this.asRecord(invoice.doctor) || {};
    const ownName = this.userDoctorName().toLowerCase();
    const ownEmail = String(this.currentUser.email || '').toLowerCase();
    return (this.currentDoctorIds.has(invoice.doctorIdValue)) ||
      (!!ownName && invoice.doctorDisplayName.toLowerCase() === ownName) ||
      (!!ownEmail && String(doctor.email || '').toLowerCase() === ownEmail);
  }

  private userDoctorName(): string {
    return this.currentUser.staffname || this.currentUser.name ||
      [this.currentUser.firstName, this.currentUser.lastName].filter(Boolean).join(' ');
  }

  private asRecord(value: any): any {
    return value && typeof value === 'object' ? value : null;
  }

  private idOf(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return String(value._id || value.id || value.doctorId || '');
  }

  startPayment(invoice: any): void {
    this.selectedInvoiceId = invoice._id;
    this.paymentDraft = {
      amount: Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.amountPaid || 0)),
      method: 'CASH',
      reference: ''
    };
  }

  cancelPayment(): void {
    this.selectedInvoiceId = '';
  }

  savePayment(): void {
    const amount = Number(this.paymentDraft.amount);
    if (!this.selectedInvoiceId || !Number.isFinite(amount) || amount <= 0) return;
    this.savingPayment = true;
    this.api.recordInvoicePayment(this.selectedInvoiceId, {
      amount,
      method: this.paymentDraft.method,
      reference: this.paymentDraft.reference.trim() || undefined
    }).subscribe({
      next: () => {
        this.savingPayment = false;
        this.selectedInvoiceId = '';
        this.messages.add({ severity: 'success', summary: 'Payment recorded', detail: 'Invoice balance has been updated.' });
        this.loadInvoices();
      },
      error: (error: any) => {
        this.savingPayment = false;
        this.messages.add({ severity: 'error', summary: 'Payment not recorded', detail: error?.error?.message || 'Please reload the invoice and try again.' });
      }
    });
  }

  balance(invoice: any): number {
    return Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.amountPaid || 0));
  }
}
