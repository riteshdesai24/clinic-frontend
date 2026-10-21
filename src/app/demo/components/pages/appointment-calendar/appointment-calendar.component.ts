import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
    selector: 'app-appointment-calendar',
    templateUrl: './appointment-calendar.component.html',
    styleUrls: ['./appointment-calendar.component.scss'],
})
export class AppointmentCalendarComponent implements OnInit {
    appointments: any[] = [];
    calendarOptions: CalendarOptions = {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek',
        },
        weekends: true,
        selectable: true,
        editable: false,
        dayMaxEvents: true,
        displayEventTime: true,
        eventDisplay: 'block',
        events: [],
        dateClick: this.onDateClick.bind(this),
        eventClick: this.onEventClick.bind(this),
    };

    constructor(
        private api: AuthService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.loadAppointments();
    }

    openNewAppointment(date?: Date): void {
        this.router.navigate(['/pages/appointment'], {
            queryParams: {
                date: date
                    ? this.toLocalDateString(date)
                    : this.toLocalDateString(new Date()),
            },
        });
    }

    private loadAppointments(): void {
        this.api.getAppointmentList({ period: 'month' }).subscribe({
            next: (res: any) => {
                const records = Array.isArray(res?.data)
                    ? res.data
                    : res?.data?.appointments || [];
                this.appointments = records;
                this.calendarOptions.events = this.appointments.map(
                    (appointment: any) => {
                        const date =
                            appointment.date || appointment.appointmentDate;
                        const time =
                            appointment.time ||
                            appointment.appointmentTime ||
                            '09:00';
                        const patientName =
                            appointment.patientName ||
                            this.getPatientName(appointment) ||
                            'Patient';

                        return {
                            id: appointment._id,
                            title: `${patientName} • ${this.formatTime12(time)}`,
                            start: this.normalizeDate(date, time),
                            end: this.normalizeDate(date, time),
                            backgroundColor: this.getStatusColor(
                                appointment.status,
                            ),
                            borderColor: this.getStatusColor(
                                appointment.status,
                            ),
                            textColor: '#ffffff',
                            extendedProps: {
                                status: appointment.status,
                                doctor:
                                    appointment.doctor ||
                                    appointment.doctorName ||
                                    'Doctor',
                                patient: patientName,
                                appointmentId: appointment._id,
                            },
                        };
                    },
                );
            },
            error: () => {
                this.calendarOptions.events = [];
            },
        });
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
                queryParams: { id: appointmentId, view: true },
            });
        }
    }

    private normalizeDate(
        dateValue: string | Date | null,
        timeValue?: string,
    ): string {
        if (!dateValue) return new Date().toISOString().slice(0, 10);
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime()))
            return new Date().toISOString().slice(0, 10);

        if (!timeValue) return this.toLocalDateString(date);

        const [hours, minutes] = String(timeValue).split(':').map(Number);
        const next = new Date(date);
        next.setHours(hours || 0, minutes || 0, 0, 0);
        return next.toISOString();
    }

    private getPatientName(appointment: any): string {
        const patient = appointment.patientId || appointment.patient;
        if (patient && typeof patient === 'object') {
            return (
                patient.name ||
                [patient.firstName, patient.middleName, patient.lastName]
                    .filter(Boolean)
                    .join(' ') ||
                'Patient'
            );
        }
        return appointment.patientName || 'Patient';
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
                return '#15998c';
            case 'SCHEDULED':
                return '#0ea5e9';
            case 'COMPLETED':
                return '#16a34a';
            case 'CANCELLED':
                return '#ef4444';
            case 'PENDING':
            default:
                return '#f59e0b';
        }
    }

    private toLocalDateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
