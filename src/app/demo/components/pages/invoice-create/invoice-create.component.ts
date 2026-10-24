import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

interface InvoiceLine {
  treatment: any | null;
  price: number;
}

@Component({
  selector: 'app-invoice-create',
  templateUrl: './invoice-create.component.html',
  styleUrls: ['./invoice-create.component.scss']
})
export class InvoiceCreateComponent implements OnInit {
  readonly Number = Number;
  filteredPatients: any[] = [];
  filteredAppointments: any[] = [];
  appointmentsForPatient: any[] = [];
  treatments: any[] = [];
  filteredTreatments: any[] = [];
  selectedPatient: any = null;
  selectedAppointment: any = null;
  invoiceType = 'STANDARD';
  invoiceDate = new Date().toISOString().slice(0, 10);
  lines: InvoiceLine[] = [{ treatment: null, price: 0 }];
  saving = false;

  constructor(private api: AuthService, private router: Router, private messages: MessageService) {}

  ngOnInit(): void {
    this.api.getTreatmentList({ status: 'ACTIVE', limit: 200 }).subscribe({
      next: (response: any) => {
        const data = response?.data;
        this.treatments = Array.isArray(data) ? data : data?.treatments || data?.items || response?.treatments || [];
        this.filteredTreatments = this.treatments.map(treatment => ({
          ...treatment,
          label: treatment.name || treatment.treatmentName || treatment.description || 'Treatment'
        }));
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not load treatments.' })
    });
  }

  get subtotal(): number { return this.lines.reduce((sum, line) => sum + Math.max(0, Number(line.price) || 0), 0); }

  patientName(patient: any): string {
    return patient?.name || patient?.label || [patient?.firstName, patient?.middleName, patient?.lastName].filter(Boolean).join(' ') || 'Patient';
  }

  searchPatients(event: any): void {
    const query = String(event.query || '').trim();
    const request = query ? this.api.getPatientAutocomplete(query) : this.api.getPatientList();
    request.subscribe({
      next: (response: any) => {
        const data = response?.data;
        const records = Array.isArray(data) ? data : data?.patients || data?.results || response?.patients || response?.results || [];
        this.filteredPatients = records.filter((patient: any) => this.patientId(patient))
          .map((patient: any) => ({ ...patient, label: this.patientName(patient) }));
      },
      error: () => { this.filteredPatients = []; }
    });
  }

  patientId(patient: any): string { return String(patient?._id || patient?.id || patient?.patientId || ''); }

  onPatientSelected(patient: any): void {
    this.selectedPatient = patient;
    this.selectedAppointment = null;
    this.filteredAppointments = [];
    this.appointmentsForPatient = [];
    const patientId = this.patientId(patient);
    if (!patientId) return;
    this.api.getAppointmentList({ patientId, limit: 100 }).subscribe({
      next: (response: any) => {
        const data = response?.data;
        const records = Array.isArray(data) ? data : data?.appointments || response?.appointments || [];
        const patientAppointments = records.filter((appointment: any) => {
          const linkedPatient = appointment.patientId || appointment.patient;
          const linkedId = typeof linkedPatient === 'object' ? this.patientId(linkedPatient) : String(linkedPatient || '');
          return linkedId === patientId;
        });
        const patientAppointmentIds = new Set<string>(patientAppointments.map((appointment: any) => this.appointmentIdentity(appointment)));
        this.api.getInvoices({ patientId, page: 1, limit: 500 }).subscribe({
          next: (invoiceResponse: any) => {
            const invoiceData = invoiceResponse?.data;
            const invoices = Array.isArray(invoiceData) ? invoiceData : invoiceData?.invoices || invoiceResponse?.invoices || [];
            const pendingAppointmentIds = new Set<string>(invoices.filter((invoice: any) => {
              const status = String(invoice.status || invoice.paymentStatus || '').toUpperCase();
              return ['ISSUED', 'PARTIALLY_PAID', 'PENDING', 'UNPAID'].includes(status);
            }).map((invoice: any) => this.appointmentIdentity(invoice.appointmentId || invoice.appointment)));
            this.setEligibleAppointments(patientAppointments, patientAppointmentIds, pendingAppointmentIds);
          },
          error: () => this.setEligibleAppointments(patientAppointments, patientAppointmentIds, new Set<string>())
        });
      },
      error: () => { this.filteredAppointments = []; }
    });
  }

  private setEligibleAppointments(appointments: any[], patientAppointmentIds: Set<string>, pendingInvoiceAppointmentIds: Set<string>): void {
    const today = new Date();
    this.appointmentsForPatient = appointments.filter((appointment: any) => {
      if (String(appointment.status || '').toUpperCase() === 'CANCELLED') return false;
      const id = this.appointmentIdentity(appointment);
      const invoiceStatus = String(appointment.invoiceStatus || appointment.invoice?.status || '').toUpperCase();
      const embeddedPending = ['ISSUED', 'PARTIALLY_PAID', 'PENDING', 'UNPAID'].includes(invoiceStatus);
      const isToday = this.isTodayAppointment(appointment, today);
      const pending = embeddedPending || (!!id && pendingInvoiceAppointmentIds.has(id) && patientAppointmentIds.has(id));
      return isToday || pending;
    }).map((appointment: any) => ({ ...appointment, label: this.appointmentLabel(appointment) }));
    this.filteredAppointments = [...this.appointmentsForPatient];
  }

  private isTodayAppointment(appointment: any, today = new Date()): boolean {
    const rawDate = appointment?.date || appointment?.appointmentDate || appointment?.scheduledAt;
    if (!rawDate) return false;
    const date = new Date(rawDate);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  }

  appointmentLabel(appointment: any): string {
    const date = appointment?.date || appointment?.appointmentDate || appointment?.scheduledAt;
    const time = appointment?.time || appointment?.appointmentTime;
    const doctor = appointment?.doctorId?.name || appointment?.doctorName || appointment?.doctor?.name || '';
    const parsedDate = date ? new Date(date) : null;
    const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Appointment';
    return [dateLabel, time, doctor].filter(Boolean).join(' · ');
  }

  filterAppointments(event: any): void {
    const query = String(event.query || '').toLowerCase();
    if (!query) { this.filteredAppointments = [...this.appointmentsForPatient]; return; }
    this.filteredAppointments = this.appointmentsForPatient.filter(appointment =>
      `${appointment.label || this.appointmentLabel(appointment)} ${appointment.type || appointment.appointmentType || ''}`.toLowerCase().includes(query)
    );
  }

  appointmentIdentity(appointment: any): string { return String(appointment?._id || appointment?.id || appointment?.appointmentId || ''); }

  searchTreatments(event: any): void {
    const query = String(event.query || '').toLowerCase();
    this.filteredTreatments = this.treatments.filter(treatment => `${treatment.name || treatment.treatmentName || ''} ${treatment.description || ''}`.toLowerCase().includes(query))
      .map(treatment => ({ ...treatment, label: treatment.name || treatment.treatmentName || treatment.description || 'Treatment' }));
  }

  treatmentLabel(treatment: any): string {
    if (!treatment) return '';
    const name = treatment.name || treatment.treatmentName || treatment.description || treatment.label || 'Treatment';
    return `${name} · ${this.money(Number(treatment.price || treatment.amount || 0))}`;
  }

  setTreatment(index: number, treatment: any): void {
    this.lines[index].treatment = treatment;
    this.lines[index].price = Number(treatment?.price ?? treatment?.amount ?? 0);
  }

  addLine(): void { this.lines.push({ treatment: null, price: 0 }); }
  removeLine(index: number): void {
    this.lines.splice(index, 1);
    if (!this.lines.length) this.addLine();
  }

  money(amount: number): string { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0); }

  saveInvoice(): void {
    if (this.saving) return;
    if (!this.patientId(this.selectedPatient)) {
      this.messages.add({ severity: 'warn', summary: 'Select a patient', detail: 'Search for and select a patient from the patient records.' });
      return;
    }
    if (!this.lines.some(line => line.treatment && Number(line.price) > 0)) {
      this.messages.add({ severity: 'warn', summary: 'Add a treatment', detail: 'Select at least one treatment and enter a price greater than zero.' });
      return;
    }
    const items = this.lines.filter(line => line.treatment).map(line => ({
      treatmentId: line.treatment._id || line.treatment.id,
      description: line.treatment.name || line.treatment.treatmentName || line.treatment.description,
      quantity: 1,
      unitPrice: Number(line.price),
      total: Number(line.price)
    }));
    this.saving = true;
    const payload: Record<string, unknown> = {
      patientId: this.patientId(this.selectedPatient),
      invoiceType: this.invoiceType,
      invoiceDate: this.invoiceDate,
      items,
      subtotal: this.subtotal,
      gstRate: 0,
      discountAmount: 0
    };
    if (this.appointmentIdentity(this.selectedAppointment)) payload['appointmentId'] = this.appointmentIdentity(this.selectedAppointment);
    this.api.createInvoice(payload).subscribe({
      next: () => {
        this.saving = false;
        this.messages.add({ severity: 'success', summary: 'Invoice created', detail: 'The invoice has been created.' });
        this.router.navigate(['/pages/invoice-list']);
      },
      error: (error: any) => {
        this.saving = false;
        this.messages.add({ severity: 'error', summary: 'Could not create invoice', detail: error?.error?.message || 'Please check the details and try again.' });
      }
    });
  }

  cancel(): void { this.router.navigate(['/pages/invoice-list']); }

  viewPatient(): void {
    const id = this.selectedPatient?._id || this.selectedPatient?.id;
    if (id) this.router.navigate(['/pages/patient'], { queryParams: { view: true, id } });
  }
}
