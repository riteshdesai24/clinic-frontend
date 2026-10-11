import { ListPaginationComponent } from 'src/app/shared/list-pagination.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { DashboardsRoutingModule } from './dashboard-routing.module';
import { ChartModule } from 'primeng/chart';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        DashboardsRoutingModule,
        ChartModule,
        CalendarModule,
        FormsModule,
        ListPaginationComponent
    ],
    declarations: [DashboardComponent]
})
export class DashboardModule { }
