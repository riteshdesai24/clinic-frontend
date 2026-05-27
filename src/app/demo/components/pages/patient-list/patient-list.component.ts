import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss']
})
export class PatientListComponent implements OnInit {

  patientList: any[] = [];
  filteredPatientList: any[] = [];

  loading = false;
  clinicId = '';

  constructor(
    private router: Router,
    private confirm: ConfirmationService,
    private msg: MessageService,
    private api: AuthService
  ) {}

  ngOnInit(): void {

    this.clinicId =
      localStorage.getItem('clinicid') ||
      sessionStorage.getItem('clinicid') || '';

    this.loadPatients();
  }

  // ====================
  // LOAD
  // ====================
  loadPatients(): void {

    if (!this.clinicId) return;

    this.loading = true;

    this.api.getPatientList(this.clinicId)
      .subscribe({

        next: (res: any) => {

          this.patientList = res.data || [];

          this.filteredPatientList = [...this.patientList];

          this.loading = false;
        },

        error: err => {

          console.error(err);

          this.loading = false;

          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load patients'
          });
        }
      });
  }

  // ====================
  // SEARCH
  // ====================
  onSearch(e: any): void {

    const value = e.target.value.toLowerCase();

    if (!value) {
      this.filteredPatientList = [...this.patientList];
      return;
    }

    this.filteredPatientList = this.patientList.filter(p =>

      p.firstName?.toLowerCase().includes(value) ||

      p.lastName?.toLowerCase().includes(value) ||

      p.phone?.includes(value) ||

      p.email?.toLowerCase().includes(value)

    );
  }

  // ====================
  // NAV
  // ====================
  createPatient(): void {

    this.router.navigate(['/pages/patient']);
  }

  editPatient(p: any): void {

    this.router.navigate(['/pages/patient'], {
      queryParams: { edit: true, id: p._id }
    });
  }

  viewPatient(p: any): void {

    this.router.navigate(['/pages/patient'], {
      queryParams: { view: true, id: p._id }
    });
  }

  // ====================
  // DELETE
  // ====================
  deletePatient(p: any): void {

    this.confirm.confirm({

      message: `Delete ${p.firstName} ${p.lastName}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',

      accept: () => {

        this.api.deletePatient(p._id)
          .subscribe({

            next: () => {

              this.msg.add({
                severity: 'success',
                summary: 'Deleted',
                detail: 'Patient deleted'
              });

              this.loadPatients();
            },

            error: err => {

              console.error(err);

              this.msg.add({
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
