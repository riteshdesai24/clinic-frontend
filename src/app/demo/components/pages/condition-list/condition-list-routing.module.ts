import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConditionListComponent } from './condition-list.component';
const routes: Routes = [{ path: '', component: ConditionListComponent }];
@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class ConditionListRoutingModule {}
