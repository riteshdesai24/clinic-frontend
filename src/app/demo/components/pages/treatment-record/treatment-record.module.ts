import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { TreatmentRecordRoutingModule } from './treatment-record-routing.module';
import { TreatmentRecordComponent } from './treatment-record.component';

@NgModule({
  declarations: [TreatmentRecordComponent],
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, CalendarModule, DropdownModule, MultiSelectModule, InputTextModule, InputTextareaModule, TreatmentRecordRoutingModule]
})
export class TreatmentRecordModule {}
