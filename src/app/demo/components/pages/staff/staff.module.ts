import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffRoutingModule } from './staff-routing.module';
import { StaffComponent } from './staff.component';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';

@NgModule({
    imports: [
        CommonModule,
        StaffRoutingModule,
        ButtonModule,
        InputTextModule,
        FormsModule,
        ReactiveFormsModule,
        PasswordModule,
        DropdownModule
    ],
    declarations: [StaffComponent]
})
export class StaffModule { }
