import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppointmentRoutingModule } from './appointment-routing.module';
import { AppointmentSharedModule } from './shared/appointment-shared.module';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DropdownModule } from 'primeng/dropdown';

@NgModule({
  imports: [
    CommonModule,
    AppointmentRoutingModule,
    AppointmentSharedModule,

    AutoCompleteModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    InputTextareaModule
  ]
})
export class AppointmentModule { }
