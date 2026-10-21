import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
    selector: 'app-appointment',
    templateUrl: './appointment.component.html',
    styleUrls: ['./appointment.component.scss'],
})
export class AppointmentComponent implements OnInit {
    @Input() patientId?: string;
    @Input() patientName?: string;
    @Input() dialogMode = false;
    @Input() defaultDate?: Date | string | null;
    @Output() close = new EventEmitter<void>();

    appointmentForm!: FormGroup;
    loading = false;
    error: string | null = null;
    success: string | null = null;
    appointmentId: string | null = null;
    isEdit = false;
    isView = false;
    isDoctor = false;
    minAppointmentDate = this.todayAtMidnight();
    private returnUrl = '/pages/appointment-list';

    private readonly futureOrTodayValidator: ValidatorFn = (
        control: AbstractControl,
    ): ValidationErrors | null => {
        const date = this.toCalendarDate(control.value);
        if (!date) return null;
        return this.dateAtMidnight(date).getTime() <
            this.minAppointmentDate.getTime()
            ? { pastDate: true }
            : null;
    };

    doctors: any[] = [];
    filteredDoctors: any[] = [];
    patients: any[] = [];
    filteredPatients: any[] = [];
    clinicData: any = {};
    statuses = [
        { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'Pending', value: 'PENDING' },
    ];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private api: AuthService,
        private msg: MessageService,
    ) {}

    ngOnInit(): void {
        try {
            const user = JSON.parse(
                localStorage.getItem('user') ||
                    sessionStorage.getItem('user') ||
                    '{}',
            );
            this.isDoctor = String(user.role || '').toUpperCase() === 'DOCTOR';
        } catch {
            this.isDoctor = false;
        }
        this.clinicData = JSON.parse(
            localStorage.getItem('clinic') ||
                sessionStorage.getItem('clinic') ||
                '{}',
        );

        this.defaultDate =
            this.route.snapshot.queryParamMap.get('date') || this.defaultDate;
        const requestedReturnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl');
        if (requestedReturnUrl === '/' || requestedReturnUrl?.startsWith('/pages/')) {
            this.returnUrl = requestedReturnUrl;
        }
        this.appointmentId = this.route.snapshot.queryParamMap.get('id');
        this.isView =
            this.isDoctor ||
            this.route.snapshot.queryParamMap.get('view') === 'true';
        if (this.isDoctor && !this.appointmentId) {
            this.router.navigate(['/pages/appointment-list']);
            return;
        }

        const initialDate = this.defaultDate
            ? this.toCalendarDate(this.defaultDate) || ''
            : '';

        const dateValidators = [Validators.required];
        if (!this.appointmentId) dateValidators.push(this.futureOrTodayValidator);

        this.appointmentForm = this.fb.group({
            patientName: [
                { value: null, disabled: !!this.patientName },
                Validators.required,
            ],
            patientId: [this.patientId || ''],
            doctorId: [null, Validators.required],
            date: [
                initialDate && !isNaN(initialDate.getTime()) ? initialDate : '',
                dateValidators,
            ],
            time: [this.currentTime(), Validators.required],
            notes: [''],
            status: ['PENDING', Validators.required],
        });

        // Doctors and patients must resolve before we try to patch an existing
        // appointment's doctorId/patientName, since p-autoComplete needs the
        // full { label, value } object, not just a raw id or string.
        this.loadPatients(() => {
            if (this.patientId && this.patientName) {
                const preselected = {
                    label: this.patientName,
                    value: this.patientId,
                };
                this.appointmentForm.patchValue({ patientName: preselected });
            }

            this.loadDoctors(() => {
                if (this.appointmentId) {
                    this.isEdit = !this.isView;
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
        this.filteredDoctors = this.doctors.filter((d) =>
            d.label.toLowerCase().includes(query),
        );
    }

    searchPatients(event: any): void {
        const query = (event.query || '').toLowerCase();
        this.filteredPatients = this.patients.filter(
            (p) =>
                p.label.toLowerCase().includes(query) ||
                p.phone.includes(query),
        );
    }

    private formatTime(d: Date | null): string {
        if (!d) return '';
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    }

    private currentTime(): Date {
        const now = new Date();
        now.setSeconds(0, 0);
        return now;
    }

    private todayAtMidnight(): Date {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    private dateAtMidnight(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    private toCalendarDate(value: any): Date | null {
        if (!value) return null;
        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }
        if (typeof value === 'string') {
            const dateOnly = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (dateOnly) {
                return new Date(
                    Number(dateOnly[1]),
                    Number(dateOnly[2]) - 1,
                    Number(dateOnly[3]),
                );
            }
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    private isBeforeToday(value: any): boolean {
        const date = this.toCalendarDate(value);
        return !!date && this.dateAtMidnight(date).getTime() < this.todayAtMidnight().getTime();
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
        if (this.isDoctor) return;
        this.minAppointmentDate = this.todayAtMidnight();
        this.appointmentForm
            .get('date')
            ?.updateValueAndValidity({ emitEvent: false });
        if (this.appointmentForm.invalid) {
            this.appointmentForm.markAllAsTouched();
            return;
        }
        this.isEdit ? this.updateAppointment() : this.createAppointment();
    }

    createAppointment(): void {
        if (this.isDoctor) return;
        const dateControl = this.appointmentForm.get('date');
        if (this.isBeforeToday(dateControl?.value)) {
            dateControl?.setErrors({ ...dateControl.errors, pastDate: true });
            dateControl?.markAsTouched();
            return;
        }
        this.loading = true;

        const raw = this.appointmentForm.getRawValue();
        const data: any = {
            doctorId: raw.doctorId?.value || '',
            patientId:
                this.patientId || raw.patientName?.value || raw.patientId,
            date: raw.date,
            time: this.formatTime(raw.time),
            status: raw.status,
            notes: raw.notes,
        };

        this.api.createAppointment(data).subscribe({
            next: () => {
                this.success = 'Appointment booked successfully';
                this.msg.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: this.success,
                });
                this.afterSave();
            },
            error: (err) => this.handleError(err),
        });
    }

    updateAppointment(): void {
        if (this.isDoctor) return;
        if (!this.appointmentId) {
            return;
        }

        this.loading = true;

        const raw = this.appointmentForm.getRawValue();
        const data: any = {
            doctorId: raw.doctorId?.value || '',
            patientId: raw.patientName?.value || raw.patientId,
            date: raw.date,
            time: this.formatTime(raw.time),
            status: raw.status,
            notes: raw.notes,
        };

        this.api.updateAppointment(this.appointmentId, data).subscribe({
            next: () => {
                this.success = 'Appointment updated successfully';
                this.msg.add({
                    severity: 'success',
                    summary: 'Updated',
                    detail: this.success,
                });
                this.afterSave();
            },
            error: (err) => this.handleError(err),
        });
    }

    loadAppointment(): void {
        if (!this.appointmentId) {
            return;
        }

        this.loading = true;

        this.api.getAppointmentDetails(this.appointmentId).subscribe({
            next: (res: any) => {
                const appt = res.data?.appointment || res.data;
                if (appt) {
                    this.statuses = [
                        { label: 'Confirmed', value: 'CONFIRMED' },
                        { label: 'Completed', value: 'COMPLETED' },
                        { label: 'Pending', value: 'PENDING' },
                    ];
                    const doctorIdValue =
                        appt.doctorId?._id ||
                        appt.doctorId ||
                        appt.doctor ||
                        '';
                    const patientIdValue =
                        appt.patientId?._id ||
                        appt.patientId ||
                        appt.patient ||
                        '';
                    const patient =
                        appt.patientId && typeof appt.patientId === 'object'
                            ? appt.patientId
                            : null;
                    const patientName =
                        patient?.name ||
                        [patient?.firstName, patient?.lastName]
                            .filter(Boolean)
                            .join(' ') ||
                        appt.patientName;

                    this.appointmentForm.patchValue({
                        patientName:
                            this.patients.find(
                                (p) => p.value === patientIdValue,
                            ) ||
                            (patientName
                                ? { label: patientName, value: patientIdValue }
                                : null),
                        patientId: patientIdValue,
                        doctorId:
                            this.doctors.find(
                                (d) => d.value === doctorIdValue,
                            ) || null,
                        date: appt.date ? new Date(appt.date) : null,
                        time: this.parseTime(
                            appt.time || appt.appointmentTime || '',
                        ),
                        notes: appt.notes || appt.reason || '',
                        status: appt.status || '',
                    });
                }
                if (this.isView) this.appointmentForm.disable();
                this.loading = false;
            },
            error: (err) => this.handleError(err),
        });
    }

    afterSave(): void {
        this.loading = false;
        if (this.dialogMode) {
            this.close.emit();
            return;
        }
        this.returnToSource();
    }

    loadDoctors(onLoaded?: () => void): void {
        this.api.getDoctorList().subscribe({
            next: (res: any) => {
                const doctors = res.data || res || [];
                this.doctors = doctors.map((doc: any) => ({
                    label:
                        `${doc.firstName || doc.name || ''} ${doc.lastName || ''}`.trim() ||
                        doc.staffname ||
                        'Doctor',
                    value: doc._id,
                }));
                this.filteredDoctors = [...this.doctors];
                onLoaded?.();
            },
            error: () => {
                onLoaded?.();
            },
        });
    }

    loadPatients(onLoaded?: () => void): void {
        this.api.getPatientList().subscribe({
            next: (res: any) => {
                const patients = res.data || res || [];
                this.patients = patients.map((p: any) => ({
                    label: [
                        `${p.firstName || p.name || ''} ${p.lastName || ''}`.trim() ||
                            'Patient',
                        p.phone,
                    ]
                        .filter(Boolean)
                        .join(' - '),
                    phone: String(p.phone || ''),
                    value: p._id || p.id || p.patientId || p.value || '',
                }));
                this.filteredPatients = [...this.patients];
                onLoaded?.();
            },
            error: () => {
                onLoaded?.();
            },
        });
    }

    handleError(err: any): void {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Operation failed';
        this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: this.error,
        });
    }

    onCancel(): void {
        if (this.dialogMode) {
            this.close.emit();
            return;
        }
        this.returnToSource();
    }

    private returnToSource(): void {
        this.router.navigateByUrl(this.returnUrl);
    }
}
