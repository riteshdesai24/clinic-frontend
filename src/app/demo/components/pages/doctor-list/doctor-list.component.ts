import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
    selector: 'app-doctor-list',
    templateUrl: './doctor-list.component.html',
    styles: []
})
export class DoctorListComponent implements OnInit {

    doctorList: any[] = [];
    filteredDoctorList: any[] = [];
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
        this.loadDoctorList();
    }

    loadDoctorList(cursor?: string | null, append: boolean = false) {
        if (!this.clinicId) return;
        this.loading = true;
        this.authService.getDoctorList(this.clinicId, cursor, this.pageSize).subscribe({
            next: (response: any) => {
                const data = response.data || [];
                if (append) {
                    this.doctorList = this.doctorList.concat(data);
                } else {
                    this.doctorList = data;
                }
                this.filteredDoctorList = this.doctorList;
                this.count = response.count || this.doctorList.length;
                this.hasNextPage = !!response.hasNextPage;
                this.nextCursor = response.nextCursor || null;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error fetching doctor list:', error);
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load doctor list' });
            }
        });
    }

    loadMore() {
        if (this.hasNextPage && this.nextCursor) {
            this.loadDoctorList(this.nextCursor, true);
        }
    }

    onDoctorSearch(event: any) {
        const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
        if (!searchValue) {
            this.filteredDoctorList = this.doctorList;
        } else {
            this.filteredDoctorList = this.doctorList.filter(doctor =>
                doctor.doctorname.toLowerCase().includes(searchValue) ||
                doctor.email.toLowerCase().includes(searchValue) ||
                doctor.phone.includes(searchValue) ||
                doctor.specialization.toLowerCase().includes(searchValue)
            );
        }
    }

    createNewDoctor() {
        this.router.navigate(['/pages/doctor']);
    }

    editDoctor(doctor: any) {
        // TODO: Navigate to edit doctor page with doctor ID
        this.router.navigate(['/pages/doctor'], { queryParams: { edit: true, id: doctor._id } });
        this.messageService.add({ severity: 'info', summary: 'Edit', detail: `Editing doctor: ${doctor.doctorname}` });
    }

    viewDoctor(doctor: any) {
        // TODO: Navigate to edit doctor page with doctor ID
        this.router.navigate(['/pages/doctor'], { queryParams: { view: true, id: doctor._id } });
        this.messageService.add({ severity: 'info', summary: 'View', detail: `Viewing doctor: ${doctor.doctorname}` });
    }

    deleteDoctor(doctor: any) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${doctor.doctorname}?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.authService.deleteDoctor(doctor._id).subscribe({
                    next: (response) => {
                        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `${doctor.doctorname} has been deleted` });
                        this.loadDoctorList();
                    },
                    error: (error) => {
                        console.error('Error deleting doctor:', error);
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete doctor' });
                    }
                });
            }
        });
    }

}
