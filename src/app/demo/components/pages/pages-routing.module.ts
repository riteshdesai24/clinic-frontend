import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: 'membership',
                loadChildren: () => import('./membership/membership.module').then((m) => m.MembershipModule),
            },
            {
                path: 'crud',
                loadChildren: () =>
                    import('./crud/crud.module').then((m) => m.CrudModule),
            },

            {
                path: 'empty',
                loadChildren: () =>
                    import('./empty/emptydemo.module').then(
                        (m) => m.EmptyDemoModule,
                    ),
            },

            {
                path: 'timeline',
                loadChildren: () =>
                    import('./timeline/timelinedemo.module').then(
                        (m) => m.TimelineDemoModule,
                    ),
            },

            // STAFF
            {
                path: 'staff',
                loadChildren: () =>
                    import('./staff/staff.module').then((m) => m.StaffModule),
            },
            {
                path: 'staff-list',
                loadChildren: () =>
                    import('./staff-list/staff-list.module').then(
                        (m) => m.StaffListModule,
                    ),
            },

            {
                path: 'doctor-list',
                loadChildren: () =>
                    import('./doctor-list/doctor-list.module').then(
                        (m) => m.DoctorListModule,
                    ),
            },

            // PATIENT
            {
                path: 'patient',
                loadChildren: () =>
                    import('./patient/patient.module').then(
                        (m) => m.PatientModule,
                    ),
            },

            {
                path: 'patient-list',
                loadChildren: () =>
                    import('./patient-list/patient-list.module').then(
                        (m) => m.PatientListModule,
                    ),
            },
            {
                path: 'appointment',
                loadChildren: () =>
                    import('./appointment/appointment.module').then(
                        (m) => m.AppointmentModule,
                    ),
            },
            {
                path: 'appointment-calendar',
                loadChildren: () =>
                    import('./appointment-calendar/appointment-calendar.module').then(
                        (m) => m.AppointmentCalendarModule,
                    ),
            },
            {
                path: 'appointment-list',
                loadChildren: () =>
                    import('./appointment-list/appointment-list.module').then(
                        (m) => m.AppointmentListModule,
                    ),
            },
            {
                path: 'invoice-list',
                loadChildren: () =>
                    import('./invoice-list/invoice-list.module').then(
                        (m) => m.InvoiceListModule,
                    ),
            },
            {
                path: 'invoice-create',
                loadChildren: () =>
                    import('./invoice-create/invoice-create.module').then(
                        (m) => m.InvoiceCreateModule,
                    ),
            },
            {
                path: 'insurance',
                loadChildren: () =>
                    import('./insurance/insurance.module').then(
                        (m) => m.InsuranceModule,
                    ),
            },
            {
                path: 'insurance-list',
                loadChildren: () =>
                    import('./insurance-list/insurance-list.module').then(
                        (m) => m.InsuranceListModule,
                    ),
            },
            {
                path: 'treatment',
                loadChildren: () =>
                    import('./treatment/treatment.module').then(
                        (m) => m.TreatmentModule,
                    ),
            },
            {
                path: 'treatment-record',
                loadChildren: () =>
                    import('./treatment-record/treatment-record.module').then(
                        (m) => m.TreatmentRecordModule,
                    ),
            },
            {
                path: 'treatment-list',
                loadChildren: () =>
                    import('./treatment-list/treatment-list.module').then(
                        (m) => m.TreatmentListModule,
                    ),
            },
            {
                path: 'condition',
                loadChildren: () =>
                    import('./condition/condition.module').then(
                        (m) => m.ConditionModule,
                    ),
            },
            {
                path: 'attendance',
                loadChildren: () =>
                    import('./attendance/attendance.module').then(
                        (m) => m.AttendanceModule,
                    ),
            },
            {
                path: 'profile',
                loadChildren: () =>
                    import('./profile/profile.module').then(
                        (m) => m.ProfileModule,
                    ),
            },
            {
                path: 'medical-condition-list',
                loadChildren: () =>
                    import('./condition-list/condition-list.module').then(
                        (m) => m.ConditionListModule,
                    ),
            },
            {
                path: 'dental-condition-list',
                loadChildren: () =>
                    import('./condition-list/condition-list.module').then(
                        (m) => m.ConditionListModule,
                    ),
            },
            // FALLBACK
            { path: '**', redirectTo: '/notfound' },
        ]),
    ],

    exports: [RouterModule],
})
export class PagesRoutingModule {}
