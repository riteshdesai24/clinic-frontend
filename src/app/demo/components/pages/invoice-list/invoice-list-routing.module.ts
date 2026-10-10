import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { InvoiceListComponent } from './invoice-list.component';

@NgModule({
  imports: [RouterModule.forChild([{ path: '', component: InvoiceListComponent }])],
  exports: [RouterModule]
})
export class InvoiceListRoutingModule {}
