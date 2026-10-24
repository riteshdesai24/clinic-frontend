import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InvoiceCreateComponent } from './invoice-create.component';
import { InvoiceCreateRoutingModule } from './invoice-create-routing.module';

@NgModule({ declarations: [InvoiceCreateComponent], imports: [CommonModule, FormsModule, AutoCompleteModule, ButtonModule, DropdownModule, InputTextModule, InvoiceCreateRoutingModule] })
export class InvoiceCreateModule {}
