import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientListRoutingModule } from './patient-list-routing.module';
import { PatientListComponent } from './patient-list.component';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';

// Services
import { ConfirmationService, MessageService } from 'primeng/api';

@NgModule({
  declarations: [
    PatientListComponent
  ],

  imports: [
    CommonModule,
    PatientListRoutingModule,

    // PrimeNG Modules
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule
  ],

  providers: [
    ConfirmationService,
    MessageService
  ]
})
export class PatientListModule { }
