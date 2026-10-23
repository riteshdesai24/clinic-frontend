import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientVisitHistoryComponent } from './patient-visit-history.component';

@NgModule({
  declarations: [PatientVisitHistoryComponent],
  imports: [CommonModule],
  exports: [PatientVisitHistoryComponent]
})
export class PatientVisitHistoryModule {}
