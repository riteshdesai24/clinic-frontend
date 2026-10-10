import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceListComponent } from './invoice-list.component';
import { InvoiceListRoutingModule } from './invoice-list-routing.module';

@NgModule({
  declarations: [InvoiceListComponent],
  imports: [CommonModule, FormsModule, InvoiceListRoutingModule]
})
export class InvoiceListModule {}
