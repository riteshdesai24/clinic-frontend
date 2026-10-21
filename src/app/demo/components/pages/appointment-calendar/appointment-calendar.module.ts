import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FullCalendarModule } from '@fullcalendar/angular';
import { AppointmentCalendarRoutingModule } from './appointment-calendar-routing.module';
import { AppointmentCalendarComponent } from './appointment-calendar.component';

@NgModule({
    declarations: [AppointmentCalendarComponent],
    imports: [
        CommonModule,
        AppointmentCalendarRoutingModule,
        RouterModule,
        FullCalendarModule,
        ButtonModule,
    ],
})
export class AppointmentCalendarModule {}
