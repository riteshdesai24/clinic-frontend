import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TreatmentRoutingModule } from './treatment-routing.module';
import { TreatmentComponent } from './treatment.component';
@NgModule({ declarations: [TreatmentComponent], imports: [CommonModule, ReactiveFormsModule, TreatmentRoutingModule, ButtonModule, DropdownModule, InputTextModule, InputTextareaModule] })
export class TreatmentModule {}
