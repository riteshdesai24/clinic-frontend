import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorListRoutingModule } from './doctor-list-routing.module';
import { DoctorListComponent } from './doctor-list.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

@NgModule({
    imports: [
        CommonModule,
        DoctorListRoutingModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        TagModule,
        ConfirmDialogModule,
        ToastModule,
        TooltipModule
    ],
    declarations: [DoctorListComponent],
    providers: [ConfirmationService, MessageService]
})
export class DoctorListModule { }
