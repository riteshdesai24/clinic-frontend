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


@NgModule({
  declarations: [
    PatientComponent
  ],
  imports: [
    CommonModule,
    PatientRoutingModule,

    FormsModule,
    ReactiveFormsModule,

    DropdownModule,
    InputTextModule,
    ButtonModule,
    ProgressSpinnerModule,
    InputTextareaModule
  ]
})
export class PatientModule { }
