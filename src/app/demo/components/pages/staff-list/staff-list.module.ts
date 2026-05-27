import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffListRoutingModule } from './staff-list-routing.module';
import { StaffListComponent } from './staff-list.component';
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
        StaffListRoutingModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        TagModule,
        ConfirmDialogModule,
        ToastModule,
        TooltipModule
    ],
    declarations: [StaffListComponent],
    providers: [ConfirmationService, MessageService]
})
export class StaffListModule { }
