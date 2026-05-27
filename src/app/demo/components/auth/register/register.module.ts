import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterRoutingModule } from './register-routing.module';
import { RegisterComponent } from './register.component';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
    imports: [
        CommonModule,
        RegisterRoutingModule,
        ButtonModule,
        InputTextModule,
        FormsModule,
        ReactiveFormsModule,
        PasswordModule
    ],
    declarations: [RegisterComponent]
})
export class RegisterModule { }
