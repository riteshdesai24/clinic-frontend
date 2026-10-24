import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/demo/service/auth.service';
import { MembershipAccessService } from 'src/app/core/membership-access.service';

type DashboardPeriod = 'week' | 'month';

interface AppointmentSummary {
  all: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

type AppointmentSummaryPeriod = 'today' | 'week' | 'month';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentRouteUrl = '/';
  clinicName = '';
  userName = '';
  role = '';
  hasActiveMembership = false;
  period: DashboardPeriod = 'week';
  summaryPeriod: AppointmentSummaryPeriod = 'week';
  invoicePeriod: DashboardPeriod = 'week';
  loading = false;
  pendingLoading = false;
  pendingError = '';
  pendingCount = 0;
  pendingAppointments: any[] = [];
  allCount = 0;
  allAppointments: any[] = [];
  cancelledCount = 0;
  cancelledAppointments: any[] = [];
  completedCount = 0;
  completedAppointments: any[] = [];
  todayAppointments: any[] = [];
  todayAppointmentsLoading = false;
  todayAppointmentsError = '';
  completedLoading = false;
  completedError = '';
  allLoading = false;
  allError = '';
  cancelledLoading = false;
  cancelledError = '';
  appointmentStatus: 'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED' = 'PENDING';
  patientSearch = '';
  treatmentSearch = '';
  appointmentPage = 1;
  readonly appointmentPageSize = 5;
  doctors: Array<{ _id: string; staffname: string }> = [];
  selectedDoctorId = '';
  currentDoctorId = '';
  monthlyIncome = Array(12).fill(0);
  overviewRevenue = 0;
  overviewBilledRevenue = 0;
  overviewPatientCount = 0;
  overviewActivePatientCount = 0;
  overviewStaffCount = 0;
  overviewStaffNewThisMonth = 0;
  incomeYears: number[] = [];
  selectedIncomeYear: number | 'ALL' = new Date().getFullYear();
  incomeYearDate = new Date();
  private incomeInvoices: any[] = [];
  monthlyIncomeLoading = false;
  monthlyIncomeError = '';
  monthlyIncomeChart: any;
  monthlyIncomeChartOptions: any;
  appointmentStatusChart: any;
  appointmentStatusChartOptions: any;
  private treatmentNameByAppointment = new Map<string, string>();
  private patientById = new Map<string, any>();
  invoiceLoading = false;
  invoiceError = '';
  weeklyInvoices: any[] = [];
  invoicePage = 1;
  readonly invoicePageSize = 5;
  weeklyInvoiceTotal = 0;
  weeklyInvoicePaid = 0;
  weeklyInvoiceOutstanding = 0;
  invoiceCardsLoading = false;
  monthlyInvoiceCardTotal = 0;
  monthlyInvoiceCardPaid = 0;
  monthlyInvoiceCardBalance = 0;
  weeklyInvoiceCardTotal = 0;
  weeklyInvoiceCardPaid = 0;
  weeklyInvoiceCardBalance = 0;
  dailyInvoiceCardTotal = 0;
  dailyInvoiceCardPaid = 0;
  dailyInvoiceCardBalance = 0;
  invoiceCardDate = new Date();
  errorMessage = '';
  appointmentSummaries: Record<AppointmentSummaryPeriod, AppointmentSummary> = {
    today: this.emptySummary(),
    week: this.emptySummary(),
    month: this.emptySummary()
  };

  get overviewRevenuePercent(): number {
    return this.overviewBilledRevenue ? Math.min(100, Math.round(this.overviewRevenue / this.overviewBilledRevenue * 100)) : 0;
  }

  get overviewAppointmentCompletionPercent(): number {
    const summary = this.appointmentSummaries.month;
    return summary.all ? Math.min(100, Math.round(summary.completed / summary.all * 100)) : 0;
  }

  get overviewActivePatientPercent(): number {
    return this.overviewPatientCount ? Math.min(100, Math.round(this.overviewActivePatientCount / this.overviewPatientCount * 100)) : 0;
  }

  get overviewStaffNewPercent(): number {
    return this.overviewStaffCount ? Math.min(100, Math.round(this.overviewStaffNewThisMonth / this.overviewStaffCount * 100)) : 0;
  }

  constructor(private api: AuthService, private router: Router, private membershipAccess: MembershipAccessService) {}

  ngOnInit(): void {
    this.refreshMembershipStatus();
    this.currentRouteUrl = this.router.url || '/';
    try {
      const clinic = JSON.parse(localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      this.clinicName = clinic.clinicName || user.clinicName || '';
      this.userName = user.staffname || user.name || user.firstName || '';
      this.role = String(user.role || '').toUpperCase();
      const doctorIdentity = user.doctorId || user.staffId || user._id || user.id || user.userId || '';
      this.currentDoctorId = typeof doctorIdentity === 'object'
        ? String(doctorIdentity._id || doctorIdentity.id || '')
        : String(doctorIdentity);
    } catch {
      this.clinicName = '';
    }
    if (this.isAdmin) this.loadDoctors();
    this.configureIncomeChart();
    this.loadAppointments();
    this.loadPendingAppointments();
    this.loadCompletedAppointments();
    this.loadAllAppointments();
    this.loadCancelledAppointments();
    this.loadTodayAppointments();
    this.loadTreatmentNames();
    this.loadPatientNames();
    this.loadOverviewStaff();
    this.loadWeeklyInvoices();
    this.loadInvoiceAmountCards();
    if (this.isAdmin) this.loadMonthlyIncome();
  }

  @HostListener('window:clinic-membership-updated')
  refreshMembershipStatus(): void {
    this.hasActiveMembership = this.membershipAccess.hasActivePlan();
  }

  setPeriod(value: string): void {
    this.period = value === 'month' ? 'month' : 'week';
    this.loadAppointments();
    this.loadPendingAppointments();
    this.loadCompletedAppointments();
    this.loadAllAppointments();
    this.loadCancelledAppointments();
  }

  setSummaryPeriod(value: AppointmentSummaryPeriod): void {
    this.summaryPeriod = value;
  }

  get activeAppointmentSummary(): AppointmentSummary {
    return this.appointmentSummaries[this.summaryPeriod];
  }

  getSummaryPercent(value: number): number {
    const total = this.activeAppointmentSummary.all;
    if (!total) return 0;
    return Math.min(100, Math.round((Number(value || 0) / total) * 100));
  }

  setInvoicePeriod(value: string): void {
    this.invoicePeriod = value === 'month' ? 'month' : 'week';
    this.loadWeeklyInvoices();
    this.loadInvoiceAmountCards();
  }

  private loadInvoiceAmountCards(): void {
    if (!this.canViewInvoiceData) return;
    this.invoiceCardsLoading = true;
    const makeParams = (period: 'week' | 'month' | 'day'): Record<string, string | number> => {
      const params: Record<string, string | number> = { page: 1, limit: 1000 };
      if (period !== 'day') params['period'] = period;
      if (this.dashboardDoctorId) params['doctorId'] = this.dashboardDoctorId;
      if (period === 'day') params['date'] = this.localDateParam(this.invoiceCardDate);
      return params;
    };
    let remaining = 3;
    const done = (): void => {
      remaining -= 1;
      if (remaining === 0) this.invoiceCardsLoading = false;
    };
    const fetchTotal = (period: 'week' | 'month' | 'day', update: (total: number, paid: number, balance: number) => void): void => {
      this.api.getInvoices(makeParams(period)).subscribe({
        next: (response: any) => {
          const records = Array.isArray(response?.data) ? response.data : response?.data?.invoices || [];
          const matching = period === 'day'
            ? records.filter((invoice: any) => this.localDateParam(new Date(invoice.issuedAt || invoice.createdAt || invoice.date)) === this.localDateParam(this.invoiceCardDate))
            : records;
          const scoped = matching.filter((invoice: any) => this.belongsToDashboardDoctor(invoice));
          const total = scoped.reduce((sum: number, invoice: any) => sum + this.invoiceAmount(invoice), 0);
          const paid = scoped.reduce((sum: number, invoice: any) => sum + this.invoicePaidAmount(invoice), 0);
          update(total, paid, Math.max(0, total - paid));
          done();
        },
        error: () => done()
      });
    };
    fetchTotal('month', (total, paid, balance) => {
      this.monthlyInvoiceCardTotal = total;
      this.monthlyInvoiceCardPaid = paid;
      this.monthlyInvoiceCardBalance = balance;
    });
    fetchTotal('week', (total, paid, balance) => {
      this.weeklyInvoiceCardTotal = total;
      this.weeklyInvoiceCardPaid = paid;
      this.weeklyInvoiceCardBalance = balance;
    });
    fetchTotal('day', (total, paid, balance) => {
      this.dailyInvoiceCardTotal = total;
      this.dailyInvoiceCardPaid = paid;
      this.dailyInvoiceCardBalance = balance;
    });
  }

  private localDateParam(value: Date): string {
    if (Number.isNaN(value.getTime())) return '';
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  setDoctor(value: string): void {
    this.selectedDoctorId = value;
    this.searchAppointments();
    this.loadAppointments();
    this.loadPendingAppointments();
    this.loadCompletedAppointments();
    this.loadAllAppointments();
    this.loadCancelledAppointments();
    this.loadTodayAppointments();
    this.loadWeeklyInvoices();
    this.loadInvoiceAmountCards();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = '';
    this.loadTodayCompletedCount();
    const periods: AppointmentSummaryPeriod[] = ['today', 'week', 'month'];
    let remaining = periods.length;
    periods.forEach(period => this.api.getDashboardAppointmentCounts(period, this.dashboardDoctorId).subscribe({
      next: (response: any) => {
        const counts = response?.byStatus || {};
        this.appointmentSummaries[period] = {
          all: Number(response?.total || 0),
          pending: Number(counts.PENDING || 0),
          confirmed: Number(counts.CONFIRMED || 0),
          completed: Number(counts.COMPLETED || 0),
          cancelled: Number(counts.CANCELLED || 0)
        };
        if (period === 'month') this.refreshAppointmentStatusChart();
        remaining -= 1;
        if (!remaining) this.loading = false;
      },
      error: () => {
        this.appointmentSummaries[period] = this.emptySummary();
        if (period === 'month') this.refreshAppointmentStatusChart();
        this.errorMessage = 'Could not load all appointment counts. Please try again.';
        remaining -= 1;
        if (!remaining) this.loading = false;
      }
    }));
  }

  private loadTodayCompletedCount(): void {
    const localMidnight = new Date();
    localMidnight.setHours(0, 0, 0, 0);
    const params: Record<string, string | number> = {
      page: 1,
      limit: 1,
      status: 'COMPLETED',
      // The appointment date is sent as a local-midnight Date and stored as
      // UTC, while the dashboard summary endpoint uses UTC day boundaries.
      date: localMidnight.toISOString().slice(0, 10)
    };
    if (this.isAdmin && this.selectedDoctorId) params['doctorId'] = this.selectedDoctorId;

    this.api.getAppointmentList(params).subscribe({
      next: (response: any) => {
        const count = Number(response?.count ?? response?.data?.count ?? 0);
        this.appointmentSummaries.today = { ...this.appointmentSummaries.today, completed: count };
      }
    });
  }

  loadTodayAppointments(): void {
    this.todayAppointmentsLoading = true;
    this.todayAppointmentsError = '';
    const today = this.localDateParam(new Date());
    const params: Record<string, string | number> = { date: today, page: 1, limit: 1000 };
    const doctorId = this.isAdmin ? this.selectedDoctorId : this.isDoctor ? this.currentDoctorId : '';
    if (doctorId) params['doctorId'] = doctorId;

    this.api.getAppointmentList(params).subscribe({
      next: (response: any) => {
        const rows = Array.isArray(response?.data) ? response.data : response?.data?.appointments || [];
        this.todayAppointments = rows
          .filter((appointment: any) => this.appointmentLocalDate(appointment.date || appointment.appointmentDate) === today)
          .map((appointment: any) => this.applyTreatmentName(this.toAppointmentRow(appointment)))
          .sort((a: any, b: any) => this.timeSortValue(a.time || a.appointmentTime) - this.timeSortValue(b.time || b.appointmentTime));
        this.todayAppointmentsLoading = false;
      },
      error: () => {
        this.todayAppointments = [];
        this.todayAppointmentsError = "Today's appointments could not be loaded.";
        this.todayAppointmentsLoading = false;
      }
    });
  }

  private appointmentLocalDate(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') {
      const datePart = value.trim().match(/^\d{4}-\d{2}-\d{2}/)?.[0];
      if (datePart) return datePart;
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : this.localDateParam(date);
  }

  private timeSortValue(value: any): number {
    const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return Number.MAX_SAFE_INTEGER;
    let hour = Number(match[1]) % 12;
    if (match[3]?.toUpperCase() === 'PM') hour += 12;
    return hour * 60 + Number(match[2]);
  }

  loadDoctors(): void {
    this.api.getDoctorList(undefined, 100).subscribe({
      next: (response: any) => {
        const records = Array.isArray(response?.data) ? response.data : response?.data?.doctors || [];
        this.doctors = records.map((doctor: any) => ({
          _id: String(doctor._id || doctor.id || ''),
          staffname: doctor.staffname || doctor.name || [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || 'Doctor'
        })).filter((doctor: any) => doctor._id);
      }
    });
  }

  private loadOverviewStaff(): void {
    this.api.getStaffList(undefined, 1000).subscribe({
      next: (response: any) => {
        const staff = Array.isArray(response?.data) ? response.data : response?.data?.staff || [];
        this.overviewStaffCount = Number(response?.count ?? staff.length);
        const now = new Date();
        this.overviewStaffNewThisMonth = staff.filter((person: any) => {
          const created = new Date(person.createdAt || person.createdDate || person.joiningDate);
          return !Number.isNaN(created.getTime()) && created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length;
      },
      error: () => { this.overviewStaffCount = 0; this.overviewStaffNewThisMonth = 0; }
    });
  }

  setAppointmentStatus(status: 'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'): void {
    this.appointmentStatus = status;
    this.appointmentPage = 1;
  }

  searchAppointments(): void {
    this.appointmentPage = 1;
  }

  onPatientSearch(event: Event): void {
    this.patientSearch = (event.target as HTMLInputElement).value;
    this.searchAppointments();
  }

  onTreatmentSearch(event: Event): void {
    this.treatmentSearch = (event.target as HTMLInputElement).value;
    this.searchAppointments();
  }

  setAppointmentPage(page: number): void {
    this.appointmentPage = page;
  }

  loadWeeklyInvoices(): void {
    if (!this.canViewInvoiceData) {
      this.weeklyInvoices = [];
      this.weeklyInvoiceTotal = 0;
      this.weeklyInvoicePaid = 0;
      this.weeklyInvoiceOutstanding = 0;
      this.invoiceLoading = false;
      this.invoiceError = '';
      return;
    }

    this.invoiceLoading = true;
    this.invoiceError = '';
    const params: Record<string, string | number> = { page: 1, limit: 1000, period: this.invoicePeriod };
    if (this.dashboardDoctorId) params['doctorId'] = this.dashboardDoctorId;

    this.api.getInvoices(params).subscribe({
      next: (response: any) => {
        const records = Array.isArray(response?.data) ? response.data : response?.data?.invoices || [];
        const { start, end } = this.currentInvoicePeriodRange();
        this.weeklyInvoices = records
          .filter((invoice: any) => {
            const issued = new Date(invoice.issuedAt || invoice.createdAt || invoice.date);
            return !Number.isNaN(issued.getTime()) && issued >= start && issued < end && this.belongsToDashboardDoctor(invoice);
          })
          .sort((a: any, b: any) => this.invoiceTimestamp(b) - this.invoiceTimestamp(a));
        this.invoicePage = 1;
        this.weeklyInvoiceTotal = this.weeklyInvoices.reduce((sum, invoice) => sum + this.invoiceAmount(invoice), 0);
        this.weeklyInvoicePaid = this.weeklyInvoices.reduce((sum, invoice) => sum + Number(invoice.amountPaid || 0), 0);
        this.weeklyInvoiceOutstanding = Math.max(0, this.weeklyInvoiceTotal - this.weeklyInvoicePaid);
        this.invoiceLoading = false;
      },
      error: () => {
        this.weeklyInvoices = [];
        this.weeklyInvoiceTotal = 0;
        this.weeklyInvoicePaid = 0;
        this.weeklyInvoiceOutstanding = 0;
        this.invoiceError = `Could not load ${this.invoicePeriodLabel.toLowerCase()} invoices.`;
        this.invoiceLoading = false;
      }
    });
  }

  setInvoicePage(page: number): void {
    this.invoicePage = page;
  }

  private currentInvoicePeriodRange(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    if (this.invoicePeriod === 'week') {
      start.setDate(now.getDate());
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);
    }
    return { start, end };
  }

  private invoiceTimestamp(invoice: any): number {
    const value = new Date(invoice.issuedAt || invoice.createdAt || invoice.date).getTime();
    return Number.isNaN(value) ? 0 : value;
  }

  invoiceAmount(invoice: any): number {
    const value = Number(invoice.totalAmount ?? invoice.total ?? invoice.amount ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  invoicePaidAmount(invoice: any): number {
    const value = Number(invoice.amountPaid);
    if (Number.isFinite(value)) return value;
    const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
    return payments.reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0);
  }

  invoiceBalance(invoice: any): number {
    return Math.max(0, this.invoiceAmount(invoice) - this.invoicePaidAmount(invoice));
  }

  private belongsToDashboardDoctor(invoice: any): boolean {
    const doctor = invoice.doctorId || invoice.doctor || invoice.appointmentId?.doctorId || invoice.appointment?.doctorId || {};
    const id = typeof doctor === 'string' ? doctor : String(doctor?._id || doctor?.id || '');
    if (this.isAdmin) return !this.selectedDoctorId || id === this.selectedDoctorId;
    return !this.isDoctor || !this.currentDoctorId || !id || id === this.currentDoctorId;
  }

  get visibleWeeklyInvoices(): any[] {
    const start = (this.invoicePage - 1) * this.invoicePageSize;
    return this.weeklyInvoices.slice(start, start + this.invoicePageSize);
  }

  getInvoicePatientName(invoice: any): string {
    const patient = invoice.patientId || invoice.patient || invoice.appointmentId?.patientId || invoice.appointment?.patient || {};
    return invoice.patientName || patient.name || patient.patientName ||
      [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ') || 'Patient';
  }

  getInvoiceDoctorName(invoice: any): string {
    const doctor = invoice.doctorId || invoice.doctor || invoice.appointmentId?.doctorId || invoice.appointment?.doctor || {};
    return invoice.doctorName || doctor.staffname || doctor.name ||
      [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || 'Doctor';
  }

  getInvoiceNumber(invoice: any): string {
    return invoice.invoiceNumber || invoice.number || invoice._id || 'Invoice';
  }

  loadPendingAppointments(): void {
    this.pendingLoading = true;
    this.pendingError = '';
    this.api.getAppointmentList(this.appointmentListParams('PENDING')).subscribe({
      next: (response: any) => {
        this.pendingCount = Number(response?.count || 0);
        const rows = Array.isArray(response?.data) ? response.data : response?.data?.appointments || [];
        this.pendingAppointments = rows.map((appointment: any) => this.applyTreatmentName(this.toAppointmentRow(appointment)));
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

  loadCompletedAppointments(): void {
    this.completedLoading = true;
    this.completedError = '';
    this.api.getAppointmentList(this.appointmentListParams('COMPLETED')).subscribe({
      next: (response: any) => {
        this.completedCount = Number(response?.count || 0);
        const rows = Array.isArray(response?.data) ? response.data : response?.data?.appointments || [];
        this.completedAppointments = rows.map((appointment: any) => this.applyTreatmentName(this.toAppointmentRow(appointment)));
        this.completedLoading = false;
      },
      error: () => {
        this.completedAppointments = [];
        this.completedCount = 0;
        this.completedError = 'Could not load completed appointments.';
        this.completedLoading = false;
      }
    });
  }

  loadAllAppointments(): void {
    this.allLoading = true;
    this.allError = '';
    this.api.getAppointmentList(this.appointmentListParams()).subscribe({
      next: (response: any) => {
        const rows = Array.isArray(response?.data) ? response.data : response?.data?.appointments || [];
        this.allCount = Number(response?.count ?? rows.length);
        this.allAppointments = rows.map((appointment: any) => this.applyTreatmentName(this.toAppointmentRow(appointment)));
        this.allLoading = false;
      },
      error: () => {
        this.allAppointments = [];
        this.allCount = 0;
        this.allError = 'Could not load appointments.';
        this.allLoading = false;
      }
    });
  }

  loadCancelledAppointments(): void {
    this.cancelledLoading = true;
    this.cancelledError = '';
    this.api.getAppointmentList(this.appointmentListParams('CANCELLED')).subscribe({
      next: (response: any) => {
        const rows = Array.isArray(response?.data) ? response.data : response?.data?.appointments || [];
        this.cancelledCount = Number(response?.count ?? rows.length);
        this.cancelledAppointments = rows.map((appointment: any) => this.applyTreatmentName(this.toAppointmentRow(appointment)));
        this.cancelledLoading = false;
      },
      error: () => {
        this.cancelledAppointments = [];
        this.cancelledCount = 0;
        this.cancelledError = 'Could not load cancelled appointments.';
        this.cancelledLoading = false;
      }
    });
  }

  private appointmentListParams(status?: 'PENDING' | 'COMPLETED' | 'CANCELLED'): Record<string, string | number> {
    const params: Record<string, string | number> = { page: 1, limit: 1000, period: this.period };
    if (status) params['status'] = status;
    const doctorId = this.isAdmin ? this.selectedDoctorId : this.isDoctor ? this.currentDoctorId : '';
    if (doctorId) params['doctorId'] = doctorId;
    return params;
  }

  private toAppointmentRow(appointment: any): any {
    const patient = appointment.patientId && typeof appointment.patientId === 'object' ? appointment.patientId : appointment.patient || {};
    const savedPatient = this.patientById.get(this.recordId(appointment.patientId || appointment.patient)) || {};
    const doctor = appointment.doctorId && typeof appointment.doctorId === 'object' ? appointment.doctorId : appointment.doctor || {};
    return {
      ...appointment,
      patientName: this.patientName(patient) || this.patientName(savedPatient) || appointment.patientName || 'Patient',
      patientPhone: patient.phone || savedPatient.phone || appointment.patientPhone || '',
      doctorName: doctor.staffname || doctor.name || [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || appointment.doctorName || 'Doctor',
      treatmentName: this.getTreatmentName(appointment)
    };
  }

  private loadPatientNames(): void {
    this.api.getPatientList().subscribe({
      next: (response: any) => {
        const patients = Array.isArray(response?.data) ? response.data : response?.data?.patients || [];
        this.overviewPatientCount = Number(response?.count ?? patients.length);
        this.overviewActivePatientCount = patients.filter((patient: any) => String(patient.status || (patient.isActive === false ? 'Inactive' : 'Active')).toLowerCase() === 'active').length;
        patients.forEach((patient: any) => {
          const id = this.recordId(patient);
          if (id) this.patientById.set(id, patient);
        });
        this.pendingAppointments = this.pendingAppointments.map(appointment => this.toAppointmentRow(appointment));
        this.completedAppointments = this.completedAppointments.map(appointment => this.toAppointmentRow(appointment));
        this.allAppointments = this.allAppointments.map(appointment => this.toAppointmentRow(appointment));
        this.cancelledAppointments = this.cancelledAppointments.map(appointment => this.toAppointmentRow(appointment));
        this.todayAppointments = this.todayAppointments.map(appointment => this.toAppointmentRow(appointment));
      }
    });
  }

  private patientName(patient: any): string {
    if (!patient) return '';
    return patient.name || patient.patientName || [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
  }

  private getTreatmentName(appointment: any): string {
    const treatment = appointment.treatmentMasterId || appointment.treatmentRecord?.treatmentMasterId ||
      appointment.treatmentId || appointment.treatment || {};
    if (typeof treatment === 'string') {
      return appointment.treatmentName || appointment.treatmentType || appointment.procedureName || '—';
    }
    const treatmentMaster = treatment.treatmentMasterId || treatment.treatmentMaster || {};
    return treatment.name || treatment.treatmentName || treatmentMaster.name || treatmentMaster.treatmentName || appointment.treatmentName ||
      appointment.treatmentType || appointment.procedureName || appointment.treatmentRecord?.treatmentName || '—';
  }

  private loadTreatmentNames(): void {
    this.api.getTreatmentRecords({ page: 1, limit: 1000 }).subscribe({
      next: (response: any) => {
        const records = Array.isArray(response?.data) ? response.data : response?.data?.treatments || [];
        records.forEach((record: any) => {
          const appointmentId = this.recordId(record.appointmentId || record.appointment);
          const master = record.treatmentMasterId || record.treatmentMaster || {};
          const name = master.name || master.treatmentName || record.treatmentName || record.treatmentType;
          if (appointmentId && name) this.treatmentNameByAppointment.set(appointmentId, name);
        });
        this.pendingAppointments = this.pendingAppointments.map(appointment => this.applyTreatmentName(appointment));
        this.completedAppointments = this.completedAppointments.map(appointment => this.applyTreatmentName(appointment));
        this.allAppointments = this.allAppointments.map(appointment => this.applyTreatmentName(appointment));
        this.cancelledAppointments = this.cancelledAppointments.map(appointment => this.applyTreatmentName(appointment));
        this.todayAppointments = this.todayAppointments.map(appointment => this.applyTreatmentName(appointment));
      },
      error: () => { /* Appointment rows still show any treatment name returned directly by the API. */ }
    });
  }

  private applyTreatmentName(appointment: any): any {
    const treatmentName = this.treatmentNameByAppointment.get(this.recordId(appointment)) || appointment.treatmentName;
    return { ...appointment, treatmentName };
  }

  private recordId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return String(value._id || value.id || '');
  }

  private configureIncomeChart(): void {
    this.monthlyIncomeChart = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Income',
        data: this.monthlyIncome,
        backgroundColor: '#60a5fa',
        hoverBackgroundColor: '#2563eb',
        borderRadius: 6,
        maxBarThickness: 36
      }]
    };
    this.monthlyIncomeChartOptions = {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { callback: (value: number) => `₹${Number(value).toLocaleString('en-IN')}` } }
      }
    };
    this.appointmentStatusChart = {
      labels: ['Completed', 'Confirmed', 'Pending', 'Cancelled'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: ['#168bff', '#00bfa5', '#ffb81c', '#ff7547'],
        hoverBackgroundColor: ['#0878e8', '#00a98f', '#eda900', '#ed6034'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    };
    this.appointmentStatusChartOptions = {
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 16 } } }
    };
  }

  private refreshAppointmentStatusChart(): void {
    if (!this.appointmentStatusChart) return;
    const summary = this.appointmentSummaries.month;
    this.appointmentStatusChart.datasets[0].data = [summary.completed, summary.confirmed, summary.pending, summary.cancelled];
    this.appointmentStatusChart = { ...this.appointmentStatusChart, datasets: [...this.appointmentStatusChart.datasets] };
  }

  loadMonthlyIncome(): void {
    this.monthlyIncomeLoading = true;
    this.monthlyIncomeError = '';
    this.api.getInvoices({ page: 1, limit: 1000 }).subscribe({
      next: (response: any) => {
        this.incomeInvoices = Array.isArray(response?.data) ? response.data : response?.data?.invoices || [];
        this.overviewRevenue = this.incomeInvoices.reduce((sum: number, invoice: any) => sum + this.invoicePaidAmount(invoice), 0);
        this.overviewBilledRevenue = this.incomeInvoices.reduce((sum: number, invoice: any) => sum + this.invoiceAmount(invoice), 0);
        this.incomeYears = this.collectIncomeYears(this.incomeInvoices);
        this.rebuildMonthlyIncome();
        this.monthlyIncomeLoading = false;
      },
      error: () => {
        this.monthlyIncomeError = 'Could not load monthly income.';
        this.monthlyIncomeLoading = false;
      }
    });
  }

  onIncomeYearChange(value: Date): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return;
    this.incomeYearDate = value;
    this.selectedIncomeYear = value.getFullYear();
    this.rebuildMonthlyIncome();
  }

  showAllIncomeYears(): void {
    this.selectedIncomeYear = 'ALL';
    this.rebuildMonthlyIncome();
  }

  private collectIncomeYears(invoices: any[]): number[] {
    const years = new Set<number>();
    invoices.forEach(invoice => {
      const payments = Array.isArray(invoice.payments) ? invoice.payments
        : Array.isArray(invoice.paymentHistory) ? invoice.paymentHistory : [];
      const dates = payments.length
        ? payments.map((payment: any) => payment.paidAt || payment.paymentDate || payment.createdAt || payment.date)
        : [invoice.issuedAt];
      dates.forEach((date: any) => {
        const parsed = new Date(date);
        if (date && !Number.isNaN(parsed.getTime())) years.add(parsed.getFullYear());
      });
    });
    years.add(new Date().getFullYear());
    return [...years].sort((a, b) => b - a);
  }

  private rebuildMonthlyIncome(): void {
    const monthlyTotals = Array(12).fill(0);
    this.incomeInvoices.forEach(invoice => {
      const payments = Array.isArray(invoice.payments) ? invoice.payments
        : Array.isArray(invoice.paymentHistory) ? invoice.paymentHistory : [];
      if (payments.length) {
        payments.forEach((payment: any) => {
          const paidAt = new Date(payment.paidAt || payment.paymentDate || payment.createdAt || payment.date);
          const amount = Number(payment.amount || 0);
          const matchesYear = this.selectedIncomeYear === 'ALL' || paidAt.getFullYear() === this.selectedIncomeYear;
          if (!Number.isNaN(paidAt.getTime()) && matchesYear && Number.isFinite(amount)) monthlyTotals[paidAt.getMonth()] += amount;
        });
      } else if (invoice.issuedAt && Number(invoice.amountPaid) > 0) {
        const issuedAt = new Date(invoice.issuedAt);
        const matchesYear = this.selectedIncomeYear === 'ALL' || issuedAt.getFullYear() === this.selectedIncomeYear;
        if (!Number.isNaN(issuedAt.getTime()) && matchesYear) monthlyTotals[issuedAt.getMonth()] += Number(invoice.amountPaid);
      }
    });
    this.monthlyIncome = monthlyTotals;
    this.monthlyIncomeChart.datasets[0].data = monthlyTotals;
    this.monthlyIncomeChart = { ...this.monthlyIncomeChart, datasets: [...this.monthlyIncomeChart.datasets] };
  }

  get periodLabel(): string {
    return this.period === 'week' ? 'This week' : 'This month';
  }

  get invoicePeriodLabel(): string {
    return this.invoicePeriod === 'week' ? 'This week' : 'This month';
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  get selectedIncomeYearLabel(): string {
    return this.selectedIncomeYear === 'ALL' ? 'All years' : String(this.selectedIncomeYear);
  }

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  get isDoctor(): boolean {
    return this.role === 'DOCTOR';
  }

  get canViewInvoiceData(): boolean {
    return this.role === 'ADMIN' || this.role === 'DOCTOR';
  }

  get dashboardDoctorId(): string | undefined {
    if (this.isAdmin) return this.selectedDoctorId || undefined;
    if (this.isDoctor) return this.currentDoctorId || undefined;
    return undefined;
  }

  get visibleAppointments(): any[] {
    const source = this.appointmentStatus === 'ALL' ? this.allAppointments
      : this.appointmentStatus === 'PENDING' ? this.pendingAppointments
      : this.appointmentStatus === 'COMPLETED' ? this.completedAppointments : this.cancelledAppointments;
    const patientQuery = this.patientSearch.trim().toLowerCase();
    const treatmentQuery = this.treatmentSearch.trim().toLowerCase();
    return source.filter(appointment =>
      (!patientQuery || appointment.patientName.toLowerCase().includes(patientQuery)) &&
      (!treatmentQuery || appointment.treatmentName.toLowerCase().includes(treatmentQuery))
    );
  }

  get appointmentStatusLabel(): string {
    if (this.appointmentStatus === 'ALL') return 'All';
    if (this.appointmentStatus === 'CANCELLED') return 'Cancelled';
    return this.appointmentStatus === 'PENDING' ? 'Pending' : 'Completed';
  }

  get visibleAppointmentPage(): any[] {
    const start = (this.activeAppointmentPage - 1) * this.appointmentPageSize;
    return this.visibleAppointments.slice(start, start + this.appointmentPageSize);
  }

  get activeAppointmentPage(): number {
    return this.appointmentPage;
  }

  get appointmentPageCount(): number {
    return Math.max(1, Math.ceil(this.visibleAppointments.length / this.appointmentPageSize));
  }

  get visibleAppointmentRangeStart(): number {
    return this.visibleAppointments.length ? (this.activeAppointmentPage - 1) * this.appointmentPageSize + 1 : 0;
  }

  get visibleAppointmentRangeEnd(): number {
    return Math.min(this.activeAppointmentPage * this.appointmentPageSize, this.visibleAppointments.length);
  }

  get visibleAppointmentLoading(): boolean {
    return this.appointmentStatus === 'ALL' ? this.allLoading
      : this.appointmentStatus === 'PENDING' ? this.pendingLoading
      : this.appointmentStatus === 'COMPLETED' ? this.completedLoading : this.cancelledLoading;
  }

  get visibleAppointmentError(): string {
    return this.appointmentStatus === 'ALL' ? this.allError
      : this.appointmentStatus === 'PENDING' ? this.pendingError
      : this.appointmentStatus === 'COMPLETED' ? this.completedError : this.cancelledError;
  }

  get visibleAppointmentCount(): number {
    return this.appointmentStatus === 'ALL' ? this.allCount
      : this.appointmentStatus === 'PENDING' ? this.pendingCount
      : this.appointmentStatus === 'COMPLETED' ? this.completedCount : this.cancelledCount;
  }

  retryVisibleAppointments(): void {
    if (this.appointmentStatus === 'ALL') this.loadAllAppointments();
    else if (this.appointmentStatus === 'PENDING') this.loadPendingAppointments();
    else if (this.appointmentStatus === 'COMPLETED') this.loadCompletedAppointments();
    else this.loadCancelledAppointments();
  }

  private emptySummary(): AppointmentSummary {
    return { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  }

}
