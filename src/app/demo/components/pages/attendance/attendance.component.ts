import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {
  role = '';
  today: any = null;
  records: any[] = [];
  summary: any[] = [];
  loading = true;
  page = 1;
  readonly pageSize = 10;

  get visibleRecords(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.records.slice(start, start + this.pageSize);
  }

  changePage(page: number): void { this.page = page; }
  working = false;

  constructor(private api: AuthService, private messages: MessageService) {}

  ngOnInit(): void {
    try {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
      this.role = JSON.parse(storedUser).role || '';
    } catch {
      this.role = '';
    }
    if (this.role === 'ADMIN') this.loadAdmin();
    else if (this.role === 'STAFF' || this.role === 'DOCTOR') this.load();
    else this.loading = false;
  }

  load(): void {
    this.loading = true;
    this.api.getTodayAttendance().subscribe({
      next: (response: any) => {
        this.today = response?.data || null;
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: 'Attendance unavailable', detail: error?.error?.message || 'Unable to load today’s attendance.' });
      }
    });
    this.api.getMyAttendance({ limit: 30 }).subscribe({
      next: (response: any) => { this.records = response?.data || []; this.page = 1; },
      error: () => this.records = []
    });
  }

  private loadAdmin(): void {
    this.loading = true;
    this.api.getAttendanceList({ limit: 50 }).subscribe({
      next: (response: any) => {
        this.records = response?.data || [];
        this.page = 1;
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: 'Attendance unavailable', detail: error?.error?.message || 'Unable to load attendance records.' });
      }
    });
    this.api.getAttendanceSummary().subscribe({
      next: (response: any) => this.summary = response?.data || [],
      error: () => this.summary = []
    });
  }

  punch(action: 'in' | 'out'): void {
    this.working = true;
    const request = action === 'in' ? this.api.clockIn() : this.api.clockOut();
    request.subscribe({
      next: (response: any) => {
        this.messages.add({ severity: 'success', summary: 'Attendance saved', detail: response?.message || `Clocked ${action}.` });
        this.working = false;
        this.load();
      },
      error: (error: any) => {
        this.working = false;
        this.messages.add({ severity: 'error', summary: 'Could not save attendance', detail: error?.error?.message || 'Please try again.' });
      }
    });
  }

  get canClockIn(): boolean { return !this.today?.clockIn; }
  get canClockOut(): boolean { return !!this.today?.clockIn && !this.today?.clockOut; }
}
