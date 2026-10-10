import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/demo/service/auth.service';

type DashboardPeriod = 'week' | 'month';

interface AppointmentSummary {
  all: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  clinicName = '';
  userName = '';
  role = '';
  period: DashboardPeriod = 'week';
  loading = false;
  pendingLoading = false;
  pendingError = '';
  pendingCount = 0;
  pendingAppointments: any[] = [];
  doctors: Array<{ _id: string; staffname: string }> = [];
  selectedDoctorId = '';
  invoiceLoading = false;
  invoiceError = '';
  doctorEarnings: any[] = [];
  clinicMonthlyTotals = { invoiceCount: 0, invoicedAmount: 0, paidAmount: 0, paymentCount: 0, outstandingAmount: 0 };
  errorMessage = '';
  summary: AppointmentSummary = this.emptySummary();

  constructor(private api: AuthService) {}

  ngOnInit(): void {
    try {
      const clinic = JSON.parse(localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      this.clinicName = clinic.clinicName || user.clinicName || '';
      this.userName = user.staffname || user.name || user.firstName || '';
      this.role = String(user.role || '').toUpperCase();
    } catch {
      this.clinicName = '';
    }
    if (this.role !== 'DOCTOR') this.loadDoctors();
    this.loadAppointments();
    this.loadPendingAppointments();
    this.loadInvoiceSummary();
  }

  setPeriod(value: string): void {
    this.period = value === 'month' ? 'month' : 'week';
    this.loadAppointments();
    this.loadInvoiceSummary();
  }

  setDoctor(value: string): void {
    this.selectedDoctorId = value;
    this.loadAppointments();
    this.loadPendingAppointments();
    this.loadInvoiceSummary();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getDashboardAppointmentCounts(this.period, this.selectedDoctorId || undefined).subscribe({
      next: (response: any) => {
        const counts = response?.byStatus || {};
        this.summary = {
          all: Number(response?.total || 0),
          pending: Number(counts.PENDING || 0),
          confirmed: Number(counts.CONFIRMED || 0),
          completed: Number(counts.COMPLETED || 0),
          cancelled: Number(counts.CANCELLED || 0)
        };
        this.loading = false;
      },
      error: () => {
        this.summary = this.emptySummary();
        this.errorMessage = 'Could not load appointment counts. Please try again.';
        this.loading = false;
      }
    });
  }

  loadDoctors(): void {
    this.api.getDoctorList(undefined, 100).subscribe({
      next: (response: any) => {
        this.doctors = response?.data || [];
      }
    });
  }

  loadInvoiceSummary(): void {
    if (!this.canViewInvoiceData) {
      this.doctorEarnings = [];
      this.invoiceLoading = false;
      this.invoiceError = '';
      return;
    }
    this.invoiceLoading = true;
    this.invoiceError = '';
    this.api.getDashboardInvoiceSummary(this.period, this.selectedDoctorId || undefined).subscribe({
      next: (response: any) => {
        this.doctorEarnings = response?.doctors || [];
        this.invoiceLoading = false;
      },
      error: () => {
        this.doctorEarnings = [];
        this.invoiceError = 'Could not load invoice earnings.';
        this.invoiceLoading = false;
      }
    });

    if (this.isAdmin) {
      this.api.getDashboardInvoiceSummary('month').subscribe({
        next: (response: any) => {
          this.clinicMonthlyTotals = response?.clinic || this.emptyInvoiceSummary();
        },
        error: () => {
          this.clinicMonthlyTotals = this.emptyInvoiceSummary();
        }
      });
    }
  }

  loadPendingAppointments(): void {
    const params: Record<string, string | number> = { status: 'PENDING', page: 1, limit: 5 };
    if (this.role === 'DOCTOR') {
      try {
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        if (user._id) params['doctorId'] = user._id;
      } catch {
        // The API request will return the relevant authorization error if user context is missing.
      }
    } else if (this.selectedDoctorId) {
      params['doctorId'] = this.selectedDoctorId;
    }

    this.pendingLoading = true;
    this.pendingError = '';
    this.api.getAppointmentList(params).subscribe({
      next: (response: any) => {
        this.pendingCount = Number(response?.count || 0);
        this.pendingAppointments = (response?.data || []).map((appointment: any) => {
          const patient = appointment.patientId && typeof appointment.patientId === 'object' ? appointment.patientId : {};
          const doctor = appointment.doctorId && typeof appointment.doctorId === 'object' ? appointment.doctorId : {};
          return {
            ...appointment,
            patientName: patient.name || [patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Patient',
            doctorName: doctor.staffname || 'Doctor'
          };
        });
        this.pendingLoading = false;
      },
      error: () => {
        this.pendingAppointments = [];
        this.pendingCount = 0;
        this.pendingError = 'Could not load pending appointments.';
        this.pendingLoading = false;
      }
    });
  }

  get periodLabel(): string {
    return this.period === 'week' ? 'This week' : 'This month';
  }

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  get canViewInvoiceData(): boolean {
    return this.role === 'ADMIN' || this.role === 'DOCTOR';
  }

  private emptySummary(): AppointmentSummary {
    return { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  }

  private emptyInvoiceSummary(): { invoiceCount: number; invoicedAmount: number; paidAmount: number; paymentCount: number; outstandingAmount: number } {
    return { invoiceCount: 0, invoicedAmount: 0, paidAmount: 0, paymentCount: 0, outstandingAmount: 0 };
  }
}
