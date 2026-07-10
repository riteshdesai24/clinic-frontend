import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientRoutingModule } from './patient-routing.module';
import { PatientComponent } from './patient.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/* PrimeNG */
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { TabMenuModule } from 'primeng/tabmenu';
import { TabViewModule } from 'primeng/tabview';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { AppointmentSharedModule } from '../appointment/shared/appointment-shared.module';

@NgModule({
  declarations: [
    PatientComponent
  ],
  imports: [
    CommonModule,
    PatientRoutingModule,
    TabMenuModule,
    TabViewModule,
    FormsModule,
    ReactiveFormsModule,
    MultiSelectModule,
    DialogModule,
    AppointmentSharedModule,

    DropdownModule,
    InputTextModule,
    ButtonModule,
    ProgressSpinnerModule,
    InputTextareaModule,
    CalendarModule
  ]
})
export class PatientModule { }
