import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
    selector: 'app-staff-list',
    templateUrl: './staff-list.component.html',
    styles: []
})
export class StaffListComponent implements OnInit {

    staffList: any[] = [];
    filteredStaffList: any[] = [];
    loading: boolean = false;
    clinicId: string = '';
    // pagination
    count: number = 0;
    hasNextPage: boolean = false;
    nextCursor: string | null = null;
    pageSize: number = 20;

    constructor(
        private router: Router,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.clinicId = localStorage.getItem('clinicid') || sessionStorage.getItem('clinicid') || '';
        this.loadStaffList();
    }

    loadStaffList(cursor?: string | null, append: boolean = false) {
        if (!this.clinicId) return;
        this.loading = true;
        this.authService.getStaffList(this.clinicId, cursor, this.pageSize).subscribe({
            next: (response: any) => {
                const data = response.data || [];
                if (append) {
                    this.staffList = this.staffList.concat(data);
                } else {
                    this.staffList = data;
                }
                this.filteredStaffList = this.staffList;
                this.count = response.count || this.staffList.length;
                this.hasNextPage = !!response.hasNextPage;
                this.nextCursor = response.nextCursor || null;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error fetching staff list:', error);
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load staff list' });
            }
        });
    }

    loadMore() {
        if (this.hasNextPage && this.nextCursor) {
            this.loadStaffList(this.nextCursor, true);
        }
    }

    onStaffSearch(event: any) {
        const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
        if (!searchValue) {
            this.filteredStaffList = this.staffList;
        } else {
            this.filteredStaffList = this.staffList.filter(staff =>
                staff.staffname.toLowerCase().includes(searchValue) ||
                staff.email.toLowerCase().includes(searchValue) ||
                staff.phone.includes(searchValue) ||
                staff.role.toLowerCase().includes(searchValue)
            );
        }
    }

    createNewStaff() {
        this.router.navigate(['/pages/staff']);
    }

    deleteStaff(staff: any) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${staff.staffname}?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.authService.deleteStaff(staff._id).subscribe({
                    next: (response) => {
                        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `${staff.staffname} has been deleted` });
                        this.loadStaffList();
                    },
                    error: (error) => {
                        console.error('Error deleting staff:', error);
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete staff' });
                    }
                });
            }
        });
    }

    editStaff(staff: any) {
        // TODO: Navigate to edit staff page with staff ID
        this.messageService.add({ severity: 'info', summary: 'Edit', detail: `Editing staff: ${staff.staffname}` });
    }
}
