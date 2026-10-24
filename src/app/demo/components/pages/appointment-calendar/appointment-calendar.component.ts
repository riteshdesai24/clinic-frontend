import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CalendarOptions, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
    selector: 'app-appointment-calendar',
    templateUrl: './appointment-calendar.component.html',
    styleUrls: ['./appointment-calendar.component.scss'],
})
export class AppointmentCalendarComponent {
    @ViewChild('calendar') calendarComponent?: FullCalendarComponent;
    appointments: any[] = [];
    todayAppointments: any[] = [];
    todayAppointmentsLoading = false;
    calendarLoadError: string | null = null;
    activeStatusFilter = 'ALL';
    activeDoctorId = '';
    activeView: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' = 'timeGridDay';
    calendarTitle = '';
    doctorOptions: { label: string; value: string }[] = [];
    private calendarEvents: any[] = [];
    private calendarRequestId = 0;

    calendarOptions: CalendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridDay',
        headerToolbar: false,
        weekends: true,
        selectable: true,
        editable: false,
        dayMaxEvents: true,
        displayEventTime: true,
        eventDisplay: 'block',
        allDaySlot: false,
        slotMinTime: '08:00:00',
        slotMaxTime: '20:00:00',
        slotDuration: '01:00:00',
        scrollTime: '08:00:00',
        height: 'auto',
        nowIndicator: true,
        events: [],
        dateClick: this.onDateClick.bind(this),
        eventClick: this.onEventClick.bind(this),
        eventDidMount: (arg) => {
            const details = arg.event.extendedProps as Record<string, any>;
            arg.el.title = [
                `Patient: ${details['patient'] || 'Unknown'}`,
                details['doctor'] && `Doctor: ${details['doctor']}`,
                details['date'] && `Date: ${details['date']}`,
                details['time'] && `Time: ${details['time']}`,
                details['treatment'] && `Treatment: ${details['treatment']}`,
                details['status'] && `Status: ${details['status']}`,
                details['notes'] && `Notes: ${details['notes']}`,
            ].filter(Boolean).join('\n');
        },
        datesSet: this.onDatesSet.bind(this),
        eventContent: (arg) => this.renderCalendarEvent(arg),
    };

    constructor(
        private api: AuthService,
        private router: Router,
    ) {
        this.api.getDoctorList().subscribe({
            next: (response: any) => {
                const doctors = this.asRecords(response?.data);
                this.doctorOptions = doctors.map((doctor: any) => ({
                    label: doctor.staffname || doctor.name || [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || 'Doctor',
                    value: this.idOf(doctor),
                })).filter((doctor: any) => doctor.value);
            },
        });
    }

    setCalendarView(view: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'): void {
        this.activeView = view;
        this.calendarComponent?.getApi().changeView(view);
    }

    moveCalendar(direction: -1 | 1): void {
        const calendar = this.calendarComponent?.getApi();
        if (!calendar) return;
        direction < 0 ? calendar.prev() : calendar.next();
    }

    goToToday(): void { this.calendarComponent?.getApi().today(); }

    setDoctorFilter(doctorId: string): void {
        this.activeDoctorId = doctorId;
        this.applyStatusFilter();
    }

    openNewAppointment(date?: Date): void {
        if (date && this.isBeforeToday(date)) return;

        this.router.navigate(['/pages/appointment'], {
            queryParams: {
                date: date
                    ? this.toLocalDateString(date)
                    : this.toLocalDateString(new Date()),
                returnUrl: this.router.url,
            },
        });
    }

    setStatusFilter(status: string): void {
        this.activeStatusFilter = status;
        this.applyStatusFilter();
    }

    getStatusCount(status: string): number {
        if (status === 'ALL') return this.calendarEvents.length;
        return this.calendarEvents.filter((event) =>
            String(event.extendedProps?.status || '').toUpperCase() === status,
        ).length;
    }

    private applyStatusFilter(): void {
        this.calendarOptions.events = this.calendarEvents.filter((event) => {
            const matchesStatus = this.activeStatusFilter === 'ALL' ||
                String(event.extendedProps?.status || '').toUpperCase() === this.activeStatusFilter;
            const matchesDoctor = !this.activeDoctorId || String(event.extendedProps?.doctorId || '') === this.activeDoctorId;
            return matchesStatus && matchesDoctor;
        });
    }

    private onDatesSet(arg: DatesSetArg): void {
        this.calendarTitle = arg.view.title;
        this.activeView = arg.view.type as 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';
        const requestId = ++this.calendarRequestId;
        this.todayAppointmentsLoading = true;
        const months = this.getCalendarMonths(arg.start, arg.end);
        const calendarRequests = months.map(({ year, month }) =>
            this.api.getAppointmentCalendar({ year, month }),
        );

        forkJoin({
            calendar: forkJoin(calendarRequests),
            appointments: this.api.getAppointmentList().pipe(catchError(() => of(null))),
            patients: this.api.getPatientList().pipe(catchError(() => of(null))),
        }).subscribe({
            next: ({ calendar, appointments, patients }: any) => {
                if (requestId !== this.calendarRequestId) return;

                const appointmentRecords = this.asRecords(appointments?.data);
                const patientRecords = this.asRecords(patients?.data);
                const appointmentById = new Map(
                    appointmentRecords.map((record: any) => [this.idOf(record), record]),
                );
                const patientById = new Map(
                    patientRecords.map((record: any) => [this.idOf(record), record]),
                );
                const today = this.toLocalDateString(new Date());
                this.todayAppointments = appointmentRecords
                    .filter((appointment: any) => this.dateKey(appointment.date || appointment.appointmentDate) === today)
                    .map((appointment: any) => {
                        const patientId = this.idOf(appointment.patientId || appointment.patient);
                        const patient = patientById.get(patientId) || {};
                        return {
                            ...appointment,
                            patient: typeof appointment.patient === 'object' && appointment.patient
                                ? appointment.patient
                                : patient,
                            patientId: appointment.patientId || patientId,
                        };
                    })
                    .sort((left: any, right: any) =>
                        this.timeSortValue(left.time || left.appointmentTime) -
                        this.timeSortValue(right.time || right.appointmentTime),
                    );
                this.todayAppointmentsLoading = false;
                const records = calendar.flatMap((response: any) =>
                    this.asRecords(response?.data),
                );
                this.appointments = records;
                this.calendarLoadError = null;
                this.calendarEvents = records.map(
                    (appointment: any) => {
                        const relatedAppointment = appointmentById.get(this.idOf(appointment)) || {};
                        const patientId = this.idOf(appointment.patientId || appointment.patient) ||
                            this.idOf(relatedAppointment.patientId || relatedAppointment.patient);
                        const patient = patientById.get(patientId) || {};
                        const appointmentWithPatient = {
                            ...relatedAppointment,
                            ...appointment,
                            patientName:
                                appointment.patientName || appointment.patient_name ||
                                relatedAppointment.patientName || relatedAppointment.patient_name,
                            patient,
                            patientId: appointment.patientId || relatedAppointment.patientId,
                            doctor:
                                (typeof appointment.doctor === 'object' && appointment.doctor) ||
                                relatedAppointment.doctor || appointment.doctor,
                            doctorId:
                                (typeof appointment.doctorId === 'object' && appointment.doctorId) ||
                                relatedAppointment.doctorId || appointment.doctorId,
                        };
                        const date =
                            appointment.date || appointment.appointmentDate;
                        const time =
                            appointment.time ||
                            appointment.appointmentTime ||
                            '09:00';
                        const patientName = this.getPatientName(appointmentWithPatient);
                        const doctorName = this.getDoctorName(appointmentWithPatient);
                        const statusColor = this.getStatusColor(
                            appointment.status,
                        );

                        return {
                            id: appointment._id,
                            title: `${this.formatTime12(time)} • Patient: ${patientName} • Dr: ${doctorName}`,
                            start: this.normalizeDate(date, time),
                            end: this.appointmentEnd(date, time, appointment.durationMinutes || appointment.duration || relatedAppointment.durationMinutes || 30),
                            backgroundColor: statusColor,
                            borderColor: statusColor,
                            textColor: '#262626',
                            extendedProps: {
                                status: appointment.status,
                                doctor: doctorName,
                                doctorId: this.idOf(appointment.doctorId || appointment.doctor || relatedAppointment.doctorId || relatedAppointment.doctor),
                                patient: patientName,
                                appointmentType: appointment.type || appointment.appointmentType || relatedAppointment.type || relatedAppointment.appointmentType || 'Appointment',
                                time: this.formatTime12(time),
                                treatment:
                                    appointment.treatmentName ||
                                    appointment.treatmentType ||
                                    appointment.procedureName ||
                                    '',
                                date: this.formatDate(date),
                                notes: appointment.notes || appointment.reason || '',
                                appointmentId: appointment._id,
                            },
                        };
                    },
                );
                this.applyStatusFilter();
            },
            error: () => {
                if (requestId !== this.calendarRequestId) return;
                this.appointments = [];
                this.todayAppointments = [];
                this.todayAppointmentsLoading = false;
                this.calendarEvents = [];
                this.calendarOptions.events = [];
                this.calendarLoadError =
                    'Could not load appointments. Please try again.';
            },
        });
    }

    private getCalendarMonths(
        start: Date,
        end: Date,
    ): Array<{ year: number; month: number }> {
        const firstMonth = new Date(start.getFullYear(), start.getMonth(), 1);
        const lastVisibleDate = new Date(end.getTime() - 1);
        const lastMonth = new Date(
            lastVisibleDate.getFullYear(),
            lastVisibleDate.getMonth(),
            1,
        );
        const months: Array<{ year: number; month: number }> = [];

        for (
            const monthStart = firstMonth;
            monthStart <= lastMonth;
            monthStart.setMonth(monthStart.getMonth() + 1)
        ) {
            months.push({
                year: monthStart.getFullYear(),
                month: monthStart.getMonth() + 1,
            });
        }

        return months;
    }

    private asRecords(data: any): any[] {
        if (Array.isArray(data)) return data;
        if (!data || typeof data !== 'object') return [];
        if (Array.isArray(data.appointments)) return data.appointments;
        if (Array.isArray(data.patients)) return data.patients;
        return Object.values(data).flatMap((value: any) =>
            Array.isArray(value) ? value : [],
        );
    }

    private idOf(value: any): string {
        if (value && typeof value === 'object') {
            value = value._id || value.id || value.value;
        }
        return value == null ? '' : String(value);
    }

    private formatDate(value: any): string {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? String(value)
            : date.toLocaleDateString();
    }

    private dateKey(value: any): string {
        if (!value) return '';
        if (typeof value === 'string') {
            const datePart = value.trim().match(/^\d{4}-\d{2}-\d{2}/)?.[0];
            if (datePart) return datePart;
        }
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? '' : this.toLocalDateString(date);
    }

    private timeSortValue(value: any): number {
        const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (!match) return Number.MAX_SAFE_INTEGER;
        let hour = Number(match[1]) % 12;
        if (match[3]?.toUpperCase() === 'PM') hour += 12;
        return hour * 60 + Number(match[2]);
    }

    private onDateClick(arg: any): void {
        this.openNewAppointment(arg.date as Date);
    }

    private onEventClick(arg: EventClickArg): void {
        const appointmentId = (arg.event.extendedProps as any)?.[
            'appointmentId'
        ];
        if (appointmentId) {
            this.router.navigate(['/pages/appointment'], {
                queryParams: {
                    id: appointmentId,
                    view: true,
                    returnUrl: this.router.url,
                },
            });
        }
    }

    private isBeforeToday(date: Date): boolean {
        const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selected < today;
    }

    private normalizeDate(
        dateValue: string | Date | null,
        timeValue?: string,
    ): string {
        if (!dateValue) return new Date().toISOString().slice(0, 10);
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime()))
            return new Date().toISOString().slice(0, 10);

        const datePart = date.toISOString().slice(0, 10);
        const time = /^\d{2}:\d{2}$/.test(timeValue || '')
            ? timeValue
            : '09:00';
        return `${datePart}T${time}:00`;
    }

    private appointmentEnd(dateValue: any, timeValue: any, duration: number): string {
        const start = new Date(this.normalizeDate(dateValue, this.to24HourTime(timeValue)));
        start.setMinutes(start.getMinutes() + Math.max(15, Number(duration) || 30));
        const year = start.getFullYear();
        const month = String(start.getMonth() + 1).padStart(2, '0');
        const day = String(start.getDate()).padStart(2, '0');
        const hours = String(start.getHours()).padStart(2, '0');
        const minutes = String(start.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:00`;
    }

    private to24HourTime(value: any): string {
        const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (!match) return '09:00';
        let hour = Number(match[1]);
        if (match[3]?.toUpperCase() === 'PM' && hour < 12) hour += 12;
        if (match[3]?.toUpperCase() === 'AM' && hour === 12) hour = 0;
        return `${String(hour).padStart(2, '0')}:${match[2]}`;
    }

    private renderCalendarEvent(arg: any): { domNodes: HTMLElement[] } {
        const details = arg.event.extendedProps as Record<string, any>;
        const event = document.createElement('div');
        event.className = `clinic-calendar-event clinic-calendar-event-${String(details['status'] || 'pending').toLowerCase()}`;
        const heading = document.createElement('div');
        heading.className = 'clinic-calendar-event-heading';
        const patient = document.createElement('strong');
        patient.textContent = String(details['patient'] || 'Patient');
        heading.appendChild(patient);
        const status = document.createElement('span');
        status.className = 'clinic-calendar-event-status';
        status.textContent = String(details['status'] || 'Scheduled').replaceAll('_', ' ');
        heading.appendChild(status);
        const time = document.createElement('small');
        time.textContent = String(details['time'] || arg.timeText || '');
        const doctor = document.createElement('small');
        doctor.textContent = String(details['doctor'] || '');
        const type = document.createElement('small');
        type.textContent = String(details['appointmentType'] || 'Appointment');
        event.append(heading, time, doctor, type);
        return { domNodes: [event] };
    }

    getPatientName(appointment: any): string {
        const possibleNames = [
            appointment.patientName,
            appointment.patient_name,
            appointment.patientname,
            appointment.patientFullName,
            appointment.patient_full_name,
            appointment.patient,
            appointment.patientId,
            appointment.patientDetails,
            appointment.patient_details,
        ];

        for (const value of possibleNames) {
            const name = this.nameFromValue(value);
            if (name) return name;
        }
        return 'Patient';
    }

    private getDoctorName(appointment: any): string {
        const doctor = appointment.doctorId || appointment.doctor;
        if (typeof doctor === 'string' && doctor.trim()) {
            return appointment.doctorName || appointment.doctor_name || 'Doctor';
        }
        if (doctor && typeof doctor === 'object') {
            const name =
                doctor.staffname ||
                doctor.name ||
                doctor.fullName ||
                [doctor.firstName || doctor.first_name, doctor.lastName || doctor.last_name]
                    .filter(Boolean)
                    .join(' ');
            if (name) return String(name).trim();
        }
        return appointment.doctorName || appointment.doctor_name || 'Doctor';
    }

    private nameFromValue(value: any): string {
        if (typeof value === 'string') return value.trim();
        if (!value || typeof value !== 'object') return '';

        const directName = [
            value.name,
            value.patientName,
            value.patient_name,
            value.patientname,
            value.fullName,
            value.full_name,
            value.displayName,
            value.display_name,
            [
                value.firstName || value.first_name,
                value.middleName || value.middle_name,
                value.lastName || value.last_name,
            ].filter(Boolean).join(' '),
        ].find((candidate) => typeof candidate === 'string' && candidate.trim());

        if (directName) return directName.trim();

        // Some appointment responses wrap the populated patient record.
        for (const nested of [value.patient, value.patientId, value.details]) {
            const nestedName = this.nameFromValue(nested);
            if (nestedName) return nestedName;
        }
        return '';
    }

    private formatTime12(value: any): string {
        if (!value) return '—';
        const match = String(value)
            .trim()
            .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
        if (!match) return String(value);
        let hour = Number(match[1]);
        const minute = Number(match[2]);
        const meridiem = String(match[3] || '').toUpperCase();
        if (meridiem) {
            if (hour < 1 || hour > 12 || minute > 59) return String(value);
        } else if (hour > 23 || minute > 59) {
            return String(value);
        }
        const suffix = meridiem || (hour >= 12 ? 'PM' : 'AM');
        const displayHour = hour % 12 || 12;
        return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
    }

    private getStatusColor(status: string): string {
        switch (String(status || '').toUpperCase()) {
            case 'CONFIRMED':
                return '#eaf1ff';
            case 'SCHEDULED':
                return '#eaf1ff';
            case 'COMPLETED':
                return '#eaf8ee';
            case 'CANCELLED':
                return '#fff0f0';
            case 'PENDING':
            default:
                return '#fff6e9';
        }
    }

    private toLocalDateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
