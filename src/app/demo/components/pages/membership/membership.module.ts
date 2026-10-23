import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MembershipComponent } from './membership.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [MembershipComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: MembershipComponent }])]
})
export class MembershipModule {}
