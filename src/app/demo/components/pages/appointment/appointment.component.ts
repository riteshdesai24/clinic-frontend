import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.scss']
})
export class AppointmentComponent implements OnInit {

  @Input() patientId?: string;
  @Input() patientName?: string;
  @Input() dialogMode = false;
  @Output() close = new EventEmitter<void>();

  appointmentForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  clinicId = '';
  appointmentId: string | null = null;
  isEdit = false;

  doctors: any[] = [];
  filteredDoctors: any[] = [];
  patients: any[] = [];
  filteredPatients: any[] = [];
  treatments: any[] = [];
  clinicData: any = {};
  statuses = [
    { label: 'Scheduled', value: 'SCHEDULED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Pending', value: 'PENDING' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private api: AuthService,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.clinicData = JSON.parse(
      localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}'
    );

    this.clinicId = this.clinicData._id || '';
    this.appointmentId = this.route.snapshot.queryParamMap.get('id');

    this.loadTreatments();

    this.appointmentForm = this.fb.group({
      patientName: [{ value: null, disabled: !!this.patientName }, Validators.required],
      patientId: [this.patientId || ''],
      doctorId: [null, Validators.required],
      date: ['', Validators.required],
      time: [null, Validators.required],
      notes: [''],
      treatmentId: [''],
      status: ['PENDING', Validators.required]
    });

    // Doctors and patients must resolve before we try to patch an existing
    // appointment's doctorId/patientName, since p-autoComplete needs the
    // full { label, value } object, not just a raw id or string.
    this.loadPatients(() => {
      if (this.patientId && this.patientName) {
        const preselected = { label: this.patientName, value: this.patientId };
        this.appointmentForm.patchValue({ patientName: preselected });
      }

      this.loadDoctors(() => {
        if (this.appointmentId) {
          this.isEdit = true;
          this.loadAppointment();
        }
      });
    });
  }

  get f() {
    return this.appointmentForm.controls;
  }

  searchDoctors(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.filteredDoctors = this.doctors.filter(d =>
      d.label.toLowerCase().includes(query)
    );
  }

  searchPatients(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.filteredPatients = this.patients.filter(p =>
      p.label.toLowerCase().includes(query)
    );
  }

  private formatTime(d: Date | null): string {
    if (!d) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private parseTime(t: string): Date | null {
    if (!t) return null;
    const [hh, mm] = t.split(':').map(Number);
    if (isNaN(hh) || isNaN(mm)) return null;
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }
    this.isEdit ? this.updateAppointment() : this.createAppointment();
  }

  createAppointment(): void {
    this.loading = true;

    const raw = this.appointmentForm.getRawValue();
    const data: any = {
      clinicId: this.clinicId,
      doctorId: raw.doctorId?.value || '',
      patientId: this.patientId || raw.patientName?.value || raw.patientId,
      date: raw.date,
      time: this.formatTime(raw.time),
      status: raw.status,
      notes: raw.notes,
      treatmentId: raw.treatmentId || null
    };

    this.api.createAppointment(data).subscribe({
      next: () => {
        this.success = 'Appointment booked successfully';
        this.msg.add({ severity: 'success', summary: 'Success', detail: this.success });
        this.afterSave();
      },
      error: err => this.handleError(err)
    });
  }

  updateAppointment(): void {
    if (!this.appointmentId) {
      return;
    }

    this.loading = true;

    const raw = this.appointmentForm.getRawValue();
    const data: any = {
      clinicId: this.clinicId,
      doctorId: raw.doctorId?.value || '',
      patientId: raw.patientName?.value || raw.patientId,
      date: raw.date,
      time: this.formatTime(raw.time),
      status: raw.status,
      notes: raw.notes,
      treatmentId: raw.treatmentId || null
    };

    this.api.updateAppointment(this.appointmentId, data).subscribe({
      next: () => {
        this.success = 'Appointment updated successfully';
        this.msg.add({ severity: 'success', summary: 'Updated', detail: this.success });
        this.afterSave();
      },
      error: err => this.handleError(err)
    });
  }

  loadAppointment(): void {
    if (!this.appointmentId) {
      return;
    }

    this.loading = true;

    this.api.getAppointmentDetails(this.appointmentId).subscribe({
      next: (res: any) => {
        const appt = res.data?.appointment;
        if (appt) {
          const doctorIdValue = appt.doctorId || appt.doctor || '';
          const patientIdValue = appt.patientId || appt.patient || '';

          this.appointmentForm.patchValue({
            patientName: this.patients.find(p => p.value === patientIdValue)
              || (appt.patientName ? { label: appt.patientName, value: patientIdValue } : null),
            patientId: patientIdValue,
            doctorId: this.doctors.find(d => d.value === doctorIdValue) || null,
            date: appt.date ? new Date(appt.date) : null,
            time: this.parseTime(appt.time || appt.appointmentTime || ''),
            notes: appt.notes || appt.reason || '',
            treatmentId: appt.treatmentId || '',
            status: appt.status || ''
          });
        }
        this.loading = false;
      },
      error: err => this.handleError(err)
    });
  }

  afterSave(): void {
    this.loading = false;
    if (this.dialogMode) {
      this.close.emit();
      return;
    }
    this.router.navigate(['/pages/appointment-list']);
  }

  loadDoctors(onLoaded?: () => void): void {
    this.api.getDoctorList().subscribe({
      next: (res: any) => {
        const doctors = res.data || res || [];
        this.doctors = doctors.map((doc: any) => ({
          label: `${doc.firstName || doc.name || ''} ${doc.lastName || ''}`.trim() || doc.staffname || 'Doctor',
          value: doc._id
        }));
        this.filteredDoctors = [...this.doctors];
        onLoaded?.();
      },
      error: () => {
        onLoaded?.();
      }
    });
  }

  loadPatients(onLoaded?: () => void): void {
    this.api.getPatientList(this.clinicId).subscribe({
      next: (res: any) => {
        const patients = res.data || res || [];
        this.patients = patients.map((p: any) => ({
          label: `${p.firstName || p.name || ''} ${p.lastName || ''}`.trim() || 'Patient',
          value: p._id || p.id || p.patientId || p.value || ''
        }));
        this.filteredPatients = [...this.patients];
        onLoaded?.();
      },
      error: () => {
        onLoaded?.();
      }
    });
  }

  loadTreatments(): void {
    this.api.getTreatmentList().subscribe({
      next: (res: any) => {
        const treatments = res.data || res || [];
        this.treatments = treatments.map((t: any) => ({
          label: t.name || t.treatmentName || 'Treatment',
          value: t._id || t.id || t.value || ''
        }));
      },
      error: () => {
        // keep empty state if API fails
      }
    });
  }

  handleError(err: any): void {
    this.loading = false;
    this.error = err?.error?.message || err?.message || 'Operation failed';
    this.msg.add({ severity: 'error', summary: 'Error', detail: this.error });
  }

  onCancel(): void {
    if (this.dialogMode) {
      this.close.emit();
      return;
    }
    this.router.navigate(['/pages/appointment-list']);
  }
}