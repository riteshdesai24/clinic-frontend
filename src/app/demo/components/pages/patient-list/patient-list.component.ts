import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss']
})
export class PatientListComponent implements OnInit {

  @ViewChild('filterPanel') filterPanel!: OverlayPanel;

  patientList: any[] = [];
  filteredPatientList: any[] = [];

  loading = false;
  searchTerm = '';
  statusFilter = 'All';
  selectedGenders: string[] = [];
  selectedConditions: string[] = [];
  selectedDoctors: string[] = [];
  minAge = 0;
  maxAge = 100;
  readonly ageBounds = 100;
  doctors: { id: string; name: string }[] = [];
  page = 1;
  readonly pageSize = 10;

  get visiblePatientList(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredPatientList.slice(start, start + this.pageSize);
  }

  changePage(page: number): void { this.page = page; }

  constructor(
    private router: Router,
    private confirm: ConfirmationService,
    private msg: MessageService,
    private api: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
    this.loadDoctors();
  }

  private loadDoctors(): void {
    this.api.getDoctorList(undefined, 100).subscribe({
      next: (res: any) => {
        const records = Array.isArray(res?.data) ? res.data : res?.data?.doctors || res?.doctors || [];
        this.doctors = records.map((doctor: any) => ({
          id: String(doctor._id || doctor.id || ''),
          name: doctor.staffname || doctor.name || [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || 'Doctor'
        })).filter((doctor: any) => doctor.id);
      },
      error: () => { this.doctors = []; }
    });
  }

  // ====================
  // LOAD
  // ====================
  loadPatients(): void {

    this.loading = true;

    this.api.getPatientList()
      .subscribe({

        next: (res: any) => {

          this.patientList = res.data || [];

          this.applyFilters();

          this.loading = false;
        },

        error: () => {

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
    this.searchTerm = (e.target.value || '').toLowerCase().trim();
    this.applyFilters();
  }

  get conditions(): string[] {
    return [...new Set(this.patientList.flatMap(p => this.patientConditions(p)))].sort((a, b) => a.localeCompare(b));
  }

  patientConditions(patient: any): string[] {
    const values = [patient.medicalConditions, patient.dentalConditions, patient.chronicConditions, patient.condition];
    return values.flatMap(value => Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,;\n]/) : [])
      .map(value => typeof value === 'object' ? value?.name || value?.label || '' : String(value))
      .map(value => value.trim()).filter(Boolean);
  }

  patientAge(patient: any): number | null {
    if (patient.age !== undefined && patient.age !== null && patient.age !== '') return Number(patient.age);
    const dob = patient.dateOfBirth || patient.dob;
    if (!dob) return null;
    const date = new Date(dob);
    if (Number.isNaN(date.getTime())) return null;
    const now = new Date();
    return now.getFullYear() - date.getFullYear() - (now < new Date(now.getFullYear(), date.getMonth(), date.getDate()) ? 1 : 0);
  }

  displayName(value: any): string {
    if (typeof value === 'string') return value;
    return value?.name || [value?.firstName, value?.lastName].filter(Boolean).join(' ');
  }

  toggleValue(values: string[], value: string, checked: boolean): void {
    const index = values.indexOf(value);
    if (checked && index < 0) values.push(value);
    if (!checked && index >= 0) values.splice(index, 1);
    this.applyFilters();
  }

  resetFilters(): void {
    this.statusFilter = 'All';
    this.selectedGenders = [];
    this.selectedConditions = [];
    this.selectedDoctors = [];
    this.minAge = 0;
    this.maxAge = this.ageBounds;
    this.applyFilters();
  }

  applyFilters(): void {
    this.page = 1;
    this.filteredPatientList = this.patientList.filter(patient => {
      const name = `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.toLowerCase();
      const searchMatch = !this.searchTerm || name.includes(this.searchTerm) || String(patient.phone || '').includes(this.searchTerm) || String(patient.email || '').toLowerCase().includes(this.searchTerm);
      const status = String(patient.status || (patient.isActive === false ? 'Inactive' : 'Active')).toLowerCase();
      const statusMatch = this.statusFilter === 'All' || status === this.statusFilter.toLowerCase();
      const gender = String(patient.gender || '').toLowerCase();
      const genderMatch = !this.selectedGenders.length || this.selectedGenders.some(item => item.toLowerCase() === gender);
      const age = this.patientAge(patient);
      const ageMatch = age === null || (age >= this.minAge && age <= this.maxAge);
      const conditions = this.patientConditions(patient);
      const conditionMatch = !this.selectedConditions.length || this.selectedConditions.some(item => conditions.some(condition => condition.toLowerCase() === item.toLowerCase()));
      const doctorValue = patient.doctor || patient.primaryDoctor || patient.generalPractitioner || patient.doctorName;
      const doctorId = String(typeof doctorValue === 'object' ? doctorValue?._id || doctorValue?.id || '' : patient.doctorId || patient.primaryDoctorId || '');
      const doctor = this.displayName(doctorValue).toLowerCase();
      const doctorMatch = !this.selectedDoctors.length || this.selectedDoctors.some(id => {
        const option = this.doctors.find(item => item.id === id);
        return doctorId === id || (!!option && doctor === option.name.toLowerCase());
      });
      return searchMatch && statusMatch && genderMatch && ageMatch && conditionMatch && doctorMatch;
    });
  }

  exportPatients(): void {
    const columns = ['Name', 'Age', 'Gender', 'Status', 'Last Visit', 'Condition', 'Doctor'];
    const rows = this.filteredPatientList.map(p => [
      `${p.firstName || ''} ${p.lastName || ''}`.trim(), this.patientAge(p) ?? '', p.gender || '',
      p.status || (p.isActive === false ? 'Inactive' : 'Active'), p.lastVisit || p.lastVisitDate || '',
      this.patientConditions(p).join('; '), this.displayName(p.doctor || p.primaryDoctor || p.generalPractitioner || p.doctorName)
    ]);
    const csv = [columns, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'patients.csv';
    link.click();
    URL.revokeObjectURL(link.href);
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

            error: () => {

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
