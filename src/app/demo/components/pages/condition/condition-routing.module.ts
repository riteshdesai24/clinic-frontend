import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConditionComponent } from './condition.component';
const routes: Routes = [{ path: '', component: ConditionComponent }];
@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class ConditionRoutingModule {}
