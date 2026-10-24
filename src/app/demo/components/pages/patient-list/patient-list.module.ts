import { ListPaginationComponent } from 'src/app/shared/list-pagination.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientListRoutingModule } from './patient-list-routing.module';
import { PatientListComponent } from './patient-list.component';
import { PatientVisitHistoryModule } from '../patient-visit-history/patient-visit-history.module';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

// Services
import { ConfirmationService, MessageService } from 'primeng/api';

@NgModule({
  declarations: [
    PatientListComponent
  ],

  imports: [
    CommonModule,
    FormsModule,
    ListPaginationComponent,
    PatientListRoutingModule,
    PatientVisitHistoryModule,

    // PrimeNG Modules
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule,
    OverlayPanelModule,
    DropdownModule
  ],

  providers: [
    ConfirmationService,
    MessageService
  ]
})
export class PatientListModule { }
