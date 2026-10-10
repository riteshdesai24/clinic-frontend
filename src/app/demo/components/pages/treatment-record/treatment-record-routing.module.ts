import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TreatmentRecordComponent } from './treatment-record.component';

const routes: Routes = [{ path: '', component: TreatmentRecordComponent }];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class TreatmentRecordRoutingModule {}
