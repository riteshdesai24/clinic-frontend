import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([

      { path: 'crud', loadChildren: () => import('./crud/crud.module').then(m => m.CrudModule) },

      { path: 'empty', loadChildren: () => import('./empty/emptydemo.module').then(m => m.EmptyDemoModule) },

      { path: 'timeline', loadChildren: () => import('./timeline/timelinedemo.module').then(m => m.TimelineDemoModule) },

      // STAFF
      { path: 'staff', loadChildren: () => import('./staff/staff.module').then(m => m.StaffModule) },
      { path: 'staff-list', loadChildren: () => import('./staff-list/staff-list.module').then(m => m.StaffListModule) },

      // DOCTOR
      { path: 'doctor', loadChildren: () => import('./doctor/doctor.module').then(m => m.DoctorModule) },
      { path: 'doctor-list', loadChildren: () => import('./doctor-list/doctor-list.module').then(m => m.DoctorListModule) },

      // PATIENT
      { path: 'patient', loadChildren: () => import('./patient/patient.module').then(m => m.PatientModule) },

      { path: 'patient-list', loadChildren: () => import('./patient-list/patient-list.module').then(m => m.PatientListModule) },
      { path: 'appointment', loadChildren: () => import('./appointment/appointment.module').then(m => m.AppointmentModule) },
      { path: 'appointment-list', loadChildren: () => import('./appointment-list/appointment-list.module').then(m => m.AppointmentListModule) },
      { path: 'insurance', loadChildren: () => import('./insurance/insurance.module').then(m => m.InsuranceModule) },
      { path: 'insurance-list', loadChildren: () => import('./insurance-list/insurance-list.module').then(m => m.InsuranceListModule) },
      { path: 'state', loadChildren: () => import('./state/state.module').then(m => m.StateModule) },
      { path: 'state-list', loadChildren: () => import('./state-list/state-list.module').then(m => m.StateListModule) },
      { path: 'city', loadChildren: () => import('./city/city.module').then(m => m.CityModule) },
      { path: 'city-list', loadChildren: () => import('./city-list/city-list.module').then(m => m.CityListModule) },
      // FALLBACK
      { path: '**', redirectTo: '/notfound' }

    ])
  ],

  exports: [RouterModule]
})
export class PagesRoutingModule { }
