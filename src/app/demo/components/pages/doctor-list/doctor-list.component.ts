import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-doctor-list',
  templateUrl: './doctor-list.component.html',
  styleUrls: ['./doctor-list.component.scss']
})
export class DoctorListComponent implements OnInit {

  doctorList: any[] = [];
  filteredDoctorList: any[] = [];

  loading = false;

  count = 0;
  hasNextPage = false;
  nextCursor: string | null = null;
  pageSize = 20;

  constructor(
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDoctorList();
  }

  // ======================
  // LOAD LIST
  // ======================
  loadDoctorList(cursor?: string | null, append = false): void {
    this.loading = true;

    // ✅ No clinicId — server reads it from JWT token
    this.authService.getDoctorList(cursor ?? undefined, this.pageSize).subscribe({

      next: (res: any) => {
        const data = res.data || [];

        this.doctorList = append
          ? [...this.doctorList, ...data]
          : data;

        this.filteredDoctorList = [...this.doctorList];

        this.count       = res.count || this.doctorList.length;
        this.hasNextPage = !!res.hasNextPage;
        this.nextCursor  = res.nextCursor || null;

        this.loading = false;
      },

      error: err => {
        console.error(err);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load doctor list'
        });
      }
    });
  }

  loadMore(): void {
    if (this.hasNextPage && this.nextCursor) {
      this.loadDoctorList(this.nextCursor, true);
    }
  }

  // ======================
  // SEARCH
  // ======================
  onDoctorSearch(event: any): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase();

    if (!value) {
      this.filteredDoctorList = [...this.doctorList];
      return;
    }

    this.filteredDoctorList = this.doctorList.filter(d =>
      d.staffname?.toLowerCase().includes(value) ||
      d.email?.toLowerCase().includes(value) ||
      d.phone?.includes(value) ||
      d.specialization?.toLowerCase().includes(value)
    );
  }

  // ======================
  // NAVIGATION
  // ======================
  createNewDoctor(): void {
    this.router.navigate(['/pages/staff'], {
      queryParams: { isUser: 'Doctor' }
    });
  }

  editDoctor(doctor: any): void {
    this.router.navigate(['/pages/staff'], {
      queryParams: {
        isUser: 'Doctor',
        id: doctor._id
      }
    });
    this.messageService.add({
      severity: 'info',
      summary: 'Edit',
      detail: `Editing ${doctor.staffname}`
    });
  }

  viewDoctor(doctor: any): void {
    this.router.navigate(['/pages/staff'], {
      queryParams: {
        isUser: 'Doctor',
        view: true,
        id: doctor._id
      }
    });
    this.messageService.add({
      severity: 'info',
      summary: 'View',
      detail: `Viewing ${doctor.staffname}`
    });
  }

  // ======================
  // DELETE
  // ======================
  deleteDoctor(doctor: any): void {
    this.confirmationService.confirm({
      message: `Delete ${doctor.staffname}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.authService.deleteDoctor(doctor._id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `${doctor.staffname} deleted`
            });
            this.loadDoctorList();
          },
          error: err => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Delete failed'
            });
          }
        });
      }
    });
  }
}