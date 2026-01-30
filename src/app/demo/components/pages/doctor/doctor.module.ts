import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorRoutingModule } from './doctor-routing.module';
import { DoctorComponent } from './doctor.component';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
    imports: [
        CommonModule,
        DoctorRoutingModule,
        ButtonModule,
        InputTextModule,
        FormsModule,
        ReactiveFormsModule,
        PasswordModule
    ],
    declarations: [DoctorComponent]
})
export class DoctorModule { }
