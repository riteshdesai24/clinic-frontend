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
  clinicId = '';

  constructor(
    private router: Router,
    private confirm: ConfirmationService,
    private msg: MessageService,
    private api: AuthService
  ) {}

  ngOnInit(): void {
    const clinicData = JSON.parse(
      localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}'
    );

    this.clinicId = clinicData._id || '';
    this.loadAppointments();
  }

  loadAppointments(): void {
    if (!this.clinicId) {
      return;
    }

    this.loading = true;

    this.api.getAppointmentList(this.clinicId).subscribe({
      next: (res: any) => {
        this.appointmentList = res.data || [];
        this.filteredAppointmentList = [...this.appointmentList];
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to load appointments' });
      }
    });
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

  deleteAppointment(item: any): void {
    this.confirm.confirm({
      message: `Delete appointment for ${item.patientName}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deleteAppointment(item._id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Deleted', detail: 'Appointment deleted' });
            this.loadAppointments();
          },
          error: err => {
            console.error(err);
            this.msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
          }
        });
      }
    });
  }
}
