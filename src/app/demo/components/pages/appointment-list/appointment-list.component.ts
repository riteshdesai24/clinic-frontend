import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-appointment-list',
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.scss']
})
export class AppointmentListComponent implements OnInit {

  @ViewChild('filterPanel') filterPanel!: OverlayPanel;

  appointmentList: any[] = [];
  filteredAppointmentList: any[] = [];
  visibleAppointmentList: any[] = [];
  readonly pageSize = 10;
  page = 1;
  selectedStatus = 'ALL';
  selectedFilterStatuses: string[] = [];
  readonly appointmentStatuses = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  loading = false;
  isAdmin = false;
  isDoctor = false;
  doctorOptions: { label: string; value: string }[] = [];
  selectedDoctorId = '';
  searchQuery = '';
  private currentUser: any = {};
  private currentDoctorIds = new Set<string>();
  private patientById = new Map<string, any>();
  showCancellationDialog = false;
  cancellationReason = '';
  appointmentToCancel: any = null;
  cancelling = false;
  showInvoiceDialog = false;
  issuingInvoice = false;
  invoiceDiscountAmount = 0;
  appointmentToInvoice: any = null;

  constructor(
    private router: Router,
    private confirm: ConfirmationService,
    private msg: MessageService,
    private api: AuthService
  ) {}

  ngOnInit(): void {
    try {
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      this.currentUser = user;
      const role = String(user.role || '').toUpperCase();
      this.isAdmin = role === 'ADMIN';
      this.isDoctor = role === 'DOCTOR';
      [user.doctorId, user.staffId, user._id, user.id, user.userId].forEach(id => {
        const value = this.idOf(id);
        if (value) this.currentDoctorIds.add(value);
      });
    } catch {
      this.isAdmin = false;
      this.isDoctor = false;
    }
    if (!this.isDoctor) this.loadDoctors();
    this.loadPatientNames();
    this.loadAppointments();
  }

  private loadPatientNames(): void {
    this.api.getPatientList().subscribe({
      next: (response: any) => {
        const patients = Array.isArray(response?.data) ? response.data : response?.data?.patients || [];
        patients.forEach((patient: any) => {
          const id = this.idOf(patient);
          if (id) this.patientById.set(id, patient);
        });
        this.appointmentList = this.appointmentList.map(item => this.toListItem(item));
        this.applyFilters();
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
        this.applyFilters();
      },
      error: () => { /* Appointments remain scoped by the authenticated API response. */ }
    });
  }

  loadAppointments(): void {
    this.loading = true;

    this.api.getAppointmentList().subscribe({
      next: (res: any) => {
        const records = Array.isArray(res?.data) ? res.data : res?.data?.appointments || [];
        this.appointmentList = records.map((appointment: any) => this.toListItem(appointment));
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to load appointments' });
      }
    });
  }

  private toListItem(appointment: any): any {
    const patient = this.asRecord(appointment.patientId) || this.asRecord(appointment.patient) || {};
    const savedPatient = this.patientById.get(this.idOf(appointment.patientId || appointment.patient)) || {};
    const doctor = this.asRecord(appointment.doctorId) || this.asRecord(appointment.doctor) || {};
    const patientName = patient.name || patient.patientName || [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ') ||
      savedPatient.name || savedPatient.patientName || [savedPatient.firstName, savedPatient.middleName, savedPatient.lastName].filter(Boolean).join(' ') || appointment.patientName;
    const doctorName = doctor.staffname || doctor.name || [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || appointment.doctorName;
    return {
      ...appointment,
      patientName: patientName || 'Patient',
      patientPhoto: patient.profilePhoto || patient.photo || savedPatient.profilePhoto || savedPatient.photo || '',
      patientPhone: patient.phone || savedPatient.phone || appointment.patientPhone || '',
      doctor: doctorName || 'Doctor',
      doctorIdValue: this.idOf(appointment.doctorId || appointment.doctor),
      appointmentDate: appointment.date,
      appointmentTime: appointment.time || appointment.appointmentTime || ''
    };
  }

  formatTime12(value: any): string {
    if (!value) return '—';
    const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match) return String(value);
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const meridiem = String(match[3] || '').toUpperCase();
    if (meridiem) {
      if (hour < 1 || hour > 12 || minute > 59) return String(value);
    } else if (hour > 23 || minute > 59) {
      return String(value);
    }
    const suffix = meridiem || (hour >= 12 ? 'PM' : 'AM');
    const displayHour = hour % 12 || 12;
    return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
  }

  onSearch(e: any): void {
    this.searchQuery = String(e.target.value || '').toLowerCase().trim();
    this.applyFilters();
  }

  onDoctorFilterChange(event: Event): void {
    this.selectedDoctorId = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onStatusFilterChange(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  setStatusTab(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  toggleFilterStatus(status: string, checked: boolean): void {
    const index = this.selectedFilterStatuses.indexOf(status);
    if (checked && index < 0) this.selectedFilterStatuses.push(status);
    if (!checked && index >= 0) this.selectedFilterStatuses.splice(index, 1);
    this.applyFilters();
  }

  toggleFilterDoctor(id: string, checked: boolean): void {
    const index = this.selectedDoctorId ? [this.selectedDoctorId].indexOf(id) : -1;
    if (checked) this.selectedDoctorId = id;
    else if (index >= 0) this.selectedDoctorId = '';
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedFilterStatuses = [];
    this.selectedDoctorId = '';
    this.applyFilters();
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = { SCHEDULED: 'Confirmed', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress', PENDING: 'Pending', CANCELLED: 'Cancelled', COMPLETED: 'Completed' };
    return labels[String(status || '').toUpperCase()] || status || 'Unknown';
  }

  openCalendar(): void { this.router.navigate(['/pages/appointment-calendar']); }

  exportAppointments(): void {
    const columns = ['Patient', 'Doctor', 'Date', 'Time', 'Status', 'Type', 'Duration'];
    const rows = this.filteredAppointmentList.map(item => [item.patientName, item.doctor, item.appointmentDate || '', this.formatTime12(item.appointmentTime), this.statusLabel(item.status), item.type || item.appointmentType || '', item.duration || '']);
    const csv = [columns, ...rows].map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'appointments.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  changePage(page: number): void {
    this.page = page;
    this.updateVisibleAppointments();
  }

  private applyFilters(): void {
    this.filteredAppointmentList = this.appointmentList.filter(item => {
      const rawStatus = String(item.status || '').toUpperCase();
      const matchesTab = this.selectedStatus === 'ALL' ||
        (this.selectedStatus === 'UPCOMING' && ['PENDING', 'SCHEDULED', 'CONFIRMED'].includes(rawStatus) && new Date(item.appointmentDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)) ||
        (this.selectedStatus === 'TODAY' && new Date(item.appointmentDate).toDateString() === new Date().toDateString()) ||
        (this.selectedStatus === 'COMPLETED' && rawStatus === 'COMPLETED') ||
        (this.selectedStatus === 'CANCELLED' && rawStatus === 'CANCELLED');
      const matchesStatus = !this.selectedFilterStatuses.length || this.selectedFilterStatuses.includes(rawStatus);
      const matchesDoctor = this.isDoctor
        ? this.belongsToCurrentDoctor(item)
        : !this.selectedDoctorId || item.doctorIdValue === this.selectedDoctorId;
      const matchesSearch = !this.searchQuery || [item.patientName, item.doctor, item.status]
        .some(value => String(value || '').toLowerCase().includes(this.searchQuery));
      return matchesTab && matchesStatus && matchesDoctor && matchesSearch;
    });
    this.page = 1;
    this.updateVisibleAppointments();
  }

  private updateVisibleAppointments(): void {
    const start = (this.page - 1) * this.pageSize;
    this.visibleAppointmentList = this.filteredAppointmentList.slice(start, start + this.pageSize);
  }

  private belongsToCurrentDoctor(item: any): boolean {
    const ownName = this.userDoctorName().toLowerCase();
    const ownEmail = String(this.currentUser.email || '').toLowerCase();
    const doctor = this.asRecord(item.doctorId) || this.asRecord(item.doctor) || {};
    return this.currentDoctorIds.has(item.doctorIdValue) ||
      (!!ownName && item.doctor.toLowerCase() === ownName) ||
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

  createAppointment(): void {
    if (this.isDoctor) return;
    this.router.navigate(['/pages/appointment'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  editAppointment(item: any): void {
    if (this.isDoctor) return;
    this.router.navigate(['/pages/appointment'], {
      queryParams: { id: item._id, returnUrl: this.router.url }
    });
  }

  viewAppointment(item: any): void {
    this.router.navigate(['/pages/appointment'], {
      queryParams: { view: true, id: item._id, returnUrl: this.router.url }
    });
  }

  addTreatment(item: any): void {
    if (this.isDoctor) return;
    this.router.navigate(['/pages/treatment-record'], { queryParams: { appointmentId: item._id } });
  }

  issueInvoice(item: any): void {
    if (this.isDoctor) return;
    this.appointmentToInvoice = item;
    this.invoiceDiscountAmount = 0;
    this.showInvoiceDialog = true;
  }

  confirmIssueInvoice(): void {
    if (!this.appointmentToInvoice || this.issuingInvoice || !Number.isFinite(Number(this.invoiceDiscountAmount)) || Number(this.invoiceDiscountAmount) < 0) return;
    this.issuingInvoice = true;
    this.api.createInvoice({ appointmentId: this.appointmentToInvoice._id, gstRate: 0, discountAmount: Number(this.invoiceDiscountAmount) }).subscribe({
      next: (response: any) => {
        this.issuingInvoice = false;
        this.showInvoiceDialog = false;
        this.msg.add({ severity: 'success', summary: 'Invoice issued', detail: response?.data?.invoiceNumber || 'Invoice created' });
        this.router.navigate(['/pages/invoice-list']);
      },
      error: (error: any) => {
        this.issuingInvoice = false;
        if (error?.status === 409 && error?.error?.data?.invoiceNumber) {
          this.showInvoiceDialog = false;
          this.msg.add({ severity: 'info', summary: 'Invoice already exists', detail: error.error.data.invoiceNumber });
          this.router.navigate(['/pages/invoice-list']);
          return;
        }
        this.msg.add({ severity: 'error', summary: 'Could not issue invoice', detail: error?.error?.message || 'Record a priced treatment first, then retry.' });
      }
    });
  }

  closeInvoiceDialog(): void {
    if (this.issuingInvoice) return;
    this.showInvoiceDialog = false;
    this.appointmentToInvoice = null;
  }

  deleteAppointment(item: any): void {
    this.confirm.confirm({
      message: `Cancel the appointment for ${item.patientName}?`,
      header: 'Cancel appointment',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.appointmentToCancel = item;
        this.cancellationReason = '';
        this.showCancellationDialog = true;
      }
    });
  }

  confirmCancellation(): void {
    const reason = this.cancellationReason.trim();
    if (!this.appointmentToCancel || !reason || this.cancelling) return;
    this.cancelling = true;
    this.api.deleteAppointment(this.appointmentToCancel._id, reason).subscribe({
      next: () => {
        this.cancelling = false;
        this.showCancellationDialog = false;
        this.appointmentToCancel = null;
        this.msg.add({ severity: 'success', summary: 'Cancelled', detail: 'Appointment cancelled' });
        this.loadAppointments();
      },
      error: (error: any) => {
        this.cancelling = false;
        this.msg.add({ severity: 'error', summary: 'Could not cancel', detail: error?.error?.message || 'Please check the appointment and try again.' });
      }
    });
  }

  closeCancellation(): void {
    if (this.cancelling) return;
    this.showCancellationDialog = false;
    this.appointmentToCancel = null;
    this.cancellationReason = '';
  }
}
