import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StaffListComponent } from './staff-list.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: StaffListComponent }
    ])],
    exports: [RouterModule]
})
export class StaffListRoutingModule { }
