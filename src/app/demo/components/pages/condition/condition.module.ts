import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConditionRoutingModule } from './condition-routing.module';
import { ConditionComponent } from './condition.component';
@NgModule({ declarations: [ConditionComponent], imports: [CommonModule, ReactiveFormsModule, ConditionRoutingModule, ButtonModule, DropdownModule, InputTextModule, InputTextareaModule] })
export class ConditionModule {}
