import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-appointment-list',
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.scss']
})
export class AppointmentListComponent implements OnInit {

  appointmentList: any[] = [];
  filteredAppointmentList: any[] = [];
  loading = false;
  isAdmin = false;
  showCancellationDialog = false;
  cancellationReason = '';
  appointmentToCancel: any = null;
  cancelling = false;

  constructor(
    private router: Router,
    private confirm: ConfirmationService,
    private msg: MessageService,
    private api: AuthService
  ) {}

  ngOnInit(): void {
    try {
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      this.isAdmin = String(user.role || '').toUpperCase() === 'ADMIN';
    } catch {
      this.isAdmin = false;
    }
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;

    this.api.getAppointmentList().subscribe({
      next: (res: any) => {
        this.appointmentList = (res.data || []).map((appointment: any) => this.toListItem(appointment));
        this.filteredAppointmentList = [...this.appointmentList];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to load appointments' });
      }
    });
  }

  private toListItem(appointment: any): any {
    const patient = appointment.patientId && typeof appointment.patientId === 'object' ? appointment.patientId : {};
    const doctor = appointment.doctorId && typeof appointment.doctorId === 'object' ? appointment.doctorId : {};
    return {
      ...appointment,
      patientName: patient.name || [patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Patient',
      doctor: doctor.staffname || 'Doctor',
      appointmentDate: appointment.date
    };
  }

  onSearch(e: any): void {
    const value = e.target.value.toLowerCase();

    if (!value) {
      this.filteredAppointmentList = [...this.appointmentList];
      return;
    }

    this.filteredAppointmentList = this.appointmentList.filter(item =>
      item.patientName?.toLowerCase().includes(value) ||
      item.doctor?.toLowerCase().includes(value) ||
      item.status?.toLowerCase().includes(value)
    );
  }

  createAppointment(): void {
    this.router.navigate(['/pages/appointment']);
  }

  editAppointment(item: any): void {
    this.router.navigate(['/pages/appointment'], {
      queryParams: { id: item._id }
    });
  }

  viewAppointment(item: any): void {
    this.router.navigate(['/pages/appointment'], {
      queryParams: { view: true, id: item._id }
    });
  }

  addTreatment(item: any): void {
    this.router.navigate(['/pages/treatment-record'], { queryParams: { appointmentId: item._id } });
  }

  issueInvoice(item: any): void {
    this.api.createInvoice({ appointmentId: item._id }).subscribe({
      next: (response: any) => {
        this.msg.add({ severity: 'success', summary: 'Invoice issued', detail: response?.data?.invoiceNumber || 'Invoice created' });
        this.router.navigate(['/pages/invoice-list']);
      },
      error: (error: any) => {
        if (error?.status === 409 && error?.error?.data?.invoiceNumber) {
          this.msg.add({ severity: 'info', summary: 'Invoice already exists', detail: error.error.data.invoiceNumber });
          this.router.navigate(['/pages/invoice-list']);
          return;
        }
        this.msg.add({ severity: 'error', summary: 'Could not issue invoice', detail: error?.error?.message || 'Record a priced treatment first, then retry.' });
      }
    });
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
