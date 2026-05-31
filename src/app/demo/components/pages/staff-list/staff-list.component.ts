import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-staff-list',
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.scss'],
  encapsulation: ViewEncapsulation.None 
})
export class StaffListComponent implements OnInit {

  staffList: any[] = [];
  filteredStaffList: any[] = [];

  loading = false;

  // Pagination
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
    this.loadStaffList();
  }

  // ======================
  // LOAD STAFF
  // ======================
  loadStaffList(cursor?: string | null, append = false): void {
    this.loading = true;

    // ✅ No clinicId — server reads it from JWT token
    this.authService.getStaffList(cursor ?? undefined, this.pageSize).subscribe({

      next: res => {
        const data = res.data || [];

        this.staffList = append
          ? this.staffList.concat(data)
          : data;

        this.filteredStaffList = this.staffList;

        this.count        = res.count || this.staffList.length;
        this.hasNextPage  = !!res.hasNextPage;
        this.nextCursor   = res.nextCursor || null;

        this.loading = false;
      },

      error: err => {
        console.error('Staff list error:', err);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load staff list'
        });
      }
    });
  }

  loadMore(): void {
    if (this.hasNextPage && this.nextCursor) {
      this.loadStaffList(this.nextCursor, true);
    }
  }

  // ======================
  // SEARCH
  // ======================
  onStaffSearch(event: any): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase();

    if (!value) {
      this.filteredStaffList = this.staffList;
      return;
    }

    this.filteredStaffList = this.staffList.filter(s =>
      s.staffname?.toLowerCase().includes(value) ||
      s.email?.toLowerCase().includes(value) ||
      s.phone?.includes(value) ||
      s.role?.toLowerCase().includes(value)
    );
  }

  // ======================
  // CREATE
  // ======================
  createNewStaff(): void {
    this.router.navigate(
      ['/pages/staff'],
      { queryParams: { isUser: 'Staff' } }
    );
  }

  // ======================
  // EDIT
  // ======================
  editStaff(staff: any): void {
    this.router.navigate(
      ['/pages/staff'],
      { queryParams: { isUser: 'Staff', id: staff._id } }
    );
    this.messageService.add({
      severity: 'info',
      summary: 'Edit',
      detail: `Editing ${staff.staffname}`
    });
  }

  // ======================
  // VIEW
  // ======================
  viewStaff(staff: any): void {
    this.router.navigate(
      ['/pages/staff'],
      { queryParams: { isUser: 'Staff', id: staff._id, view: true } }
    );
    this.messageService.add({
      severity: 'info',
      summary: 'View',
      detail: `Viewing ${staff.staffname}`
    });
  }

  // ======================
  // DELETE
  // ======================
  deleteStaff(staff: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${staff.staffname}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.authService.deleteStaff(staff._id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `${staff.staffname} deleted`
            });
            this.loadStaffList();
          },
          error: err => {
            console.error('Delete error:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete staff'
            });
          }
        });
      }
    });
  }

}