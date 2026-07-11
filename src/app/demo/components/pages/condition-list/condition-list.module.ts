import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConditionListRoutingModule } from './condition-list-routing.module';
import { ConditionListComponent } from './condition-list.component';
@NgModule({ declarations: [ConditionListComponent], imports: [CommonModule, ConditionListRoutingModule, ButtonModule, InputTextModule, TableModule, TooltipModule] })
export class ConditionListModule {}
