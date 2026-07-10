import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InsuranceListRoutingModule } from './insurance-list-routing.module';
import { InsuranceListComponent } from './insurance-list.component';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { FileUploadModule } from 'primeng/fileupload';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { ConfirmationService, MessageService } from 'primeng/api';

@NgModule({
  declarations: [InsuranceListComponent],
  imports: [
    CommonModule,
    InsuranceListRoutingModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    FileUploadModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService]
})
export class InsuranceListModule { }
