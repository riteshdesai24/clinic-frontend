import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [RouterModule.forChild([
        { path: 'crud', loadChildren: () => import('./crud/crud.module').then(m => m.CrudModule) },
        { path: 'empty', loadChildren: () => import('./empty/emptydemo.module').then(m => m.EmptyDemoModule) },
        { path: 'timeline', loadChildren: () => import('./timeline/timelinedemo.module').then(m => m.TimelineDemoModule) },
        { path: 'staff', loadChildren: () => import('./staff/staff.module').then(m => m.StaffModule) },
        { path: 'staff-list', loadChildren: () => import('./staff-list/staff-list.module').then(m => m.StaffListModule) },
        { path: 'doctor', loadChildren: () => import('./doctor/doctor.module').then(m => m.DoctorModule) },
        { path: 'doctor-list', loadChildren: () => import('./doctor-list/doctor-list.module').then(m => m.DoctorListModule) },
        { path: '**', redirectTo: '/notfound' }
    ])],
    exports: [RouterModule]
})
export class PagesRoutingModule { }
