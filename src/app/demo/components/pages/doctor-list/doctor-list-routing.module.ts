import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DoctorListComponent } from './doctor-list.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: DoctorListComponent }
    ])],
    exports: [RouterModule]
})
export class DoctorListRoutingModule { }
