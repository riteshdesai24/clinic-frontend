import { ListPaginationComponent } from 'src/app/shared/list-pagination.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppointmentListRoutingModule } from './appointment-list-routing.module';
import { AppointmentListComponent } from './appointment-list.component';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { OverlayPanelModule } from 'primeng/overlaypanel';

import { ConfirmationService, MessageService } from 'primeng/api';

@NgModule({
  declarations: [AppointmentListComponent],
  imports: [
    CommonModule,
    ListPaginationComponent,
    AppointmentListRoutingModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
    InputTextareaModule,
    OverlayPanelModule
  ],
  providers: [ConfirmationService, MessageService]
})
export class AppointmentListModule { }
