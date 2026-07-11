import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TreatmentListRoutingModule } from './treatment-list-routing.module';
import { TreatmentListComponent } from './treatment-list.component';
@NgModule({ declarations: [TreatmentListComponent], imports: [CommonModule, TreatmentListRoutingModule, ButtonModule, InputTextModule, TableModule, TooltipModule] })
export class TreatmentListModule {}
