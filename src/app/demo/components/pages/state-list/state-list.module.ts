import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StateListRoutingModule } from './state-list-routing.module';
import { StateListComponent } from './state-list.component';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';

import { ConfirmationService, MessageService } from 'primeng/api';

@NgModule({
  declarations: [StateListComponent],
  imports: [
    CommonModule,
    StateListRoutingModule,
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
export class StateListModule { }
