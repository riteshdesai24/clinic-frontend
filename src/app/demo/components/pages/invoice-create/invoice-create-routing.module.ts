import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceCreateComponent } from './invoice-create.component';

const routes: Routes = [{ path: '', component: InvoiceCreateComponent }];
@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class InvoiceCreateRoutingModule {}
