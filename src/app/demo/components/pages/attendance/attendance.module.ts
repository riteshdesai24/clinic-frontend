import { ListPaginationComponent } from 'src/app/shared/list-pagination.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { AttendanceRoutingModule } from './attendance-routing.module';
import { AttendanceComponent } from './attendance.component';

@NgModule({
  declarations: [AttendanceComponent],
  imports: [CommonModule, ButtonModule, TableModule, ListPaginationComponent, AttendanceRoutingModule]
})
export class AttendanceModule {}
