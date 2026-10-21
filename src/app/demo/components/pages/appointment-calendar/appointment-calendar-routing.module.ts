import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentCalendarComponent } from './appointment-calendar.component';

const routes: Routes = [{ path: '', component: AppointmentCalendarComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AppointmentCalendarRoutingModule {}
