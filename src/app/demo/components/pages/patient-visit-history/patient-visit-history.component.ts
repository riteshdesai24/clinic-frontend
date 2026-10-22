import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-patient-visit-history',
  templateUrl: './patient-visit-history.component.html',
  styleUrls: ['./patient-visit-history.component.scss']
})
export class PatientVisitHistoryComponent implements OnChanges {
  @Input() patientId: string | null = null;
  @Input() patientName = 'Patient';
  @Input() buttonClass = '';
  @Input() compact = false;

  visible = false;
  loading = false;
  error = '';
  visits: any[] = [];

  constructor(private api: AuthService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && this.visible) this.loadHistory();
  }

  open(): void {
    this.visible = true;
    this.loadHistory();
  }

  close(): void { this.visible = false; }

  loadHistory(): void {
    if (!this.patientId) return;
    this.loading = true;
    this.error = '';
    this.api.getAppointmentList({ patientId: this.patientId, page: 1, limit: 500 }).subscribe({
      next: (response: any) => {
        const appointments = this.records(response);
        const patientVisits = appointments.filter(visit => this.idOf(visit.patientId || visit.patient) === this.patientId);
        this.api.getTreatmentRecords({ patientId: this.patientId, limit: 500 }).subscribe({
          next: (treatmentResponse: any) => {
            const treatments = this.records(treatmentResponse);
            this.visits = patientVisits.map(visit => {
              const id = this.idOf(visit);
              const attached = Array.isArray(visit.treatments) ? visit.treatments :
                visit.treatmentRecord && typeof visit.treatmentRecord === 'object' ? [visit.treatmentRecord] : [];
              const related = treatments.filter(item => this.idOf(item.appointmentId || item.appointment) === id);
              const unique = [...attached, ...related].filter((item, index, all) =>
                all.findIndex(candidate => this.idOf(candidate) === this.idOf(item) && this.idOf(item)) === index || !this.idOf(item)
              );
              return { ...visit, visitTreatments: unique };
            }).sort((a, b) => new Date(b.date || b.appointmentDate || 0).getTime() - new Date(a.date || a.appointmentDate || 0).getTime());
            this.loading = false;
          },
          error: () => {
            this.visits = patientVisits.map(visit => ({ ...visit, visitTreatments: Array.isArray(visit.treatments) ? visit.treatments : visit.treatmentRecord ? [visit.treatmentRecord] : [] }));
            this.loading = false;
          }
        });
      },
      error: () => { this.visits = []; this.loading = false; this.error = 'Visit history could not be loaded.'; }
    });
  }

  visitDate(visit: any): any { return visit.date || visit.appointmentDate; }
  visitTime(visit: any): string { return visit.time || visit.appointmentTime || '—'; }
  doctorName(visit: any): string {
    const doctor = visit.doctorId && typeof visit.doctorId === 'object' ? visit.doctorId : visit.doctor;
    return doctor?.staffname || doctor?.name || visit.doctorName || '—';
  }
  treatmentNames(treatment: any): string[] {
    const values = treatment.treatments || treatment.treatmentMasterIds || treatment.treatmentMasterId || treatment.treatment;
    const list = Array.isArray(values) ? values : values ? [values] : [];
    return list.map((item: any) => typeof item === 'string' ? item : item?.name || item?.treatmentName).filter(Boolean);
  }
  detailFields(treatment: any): { label: string; value: string }[] {
    const known = ['diagnosis', 'description', 'duration', 'notes', 'followUpDate', 'followupDate', 'components', 'medicines'];
    const fields = known.filter(key => treatment[key] != null && treatment[key] !== '').map(key => ({ label: this.label(key), value: this.display(treatment[key]) }));
    return fields;
  }
  display(value: any): string {
    if (Array.isArray(value)) return value.map(item => typeof item === 'object' ? item?.name || item?.label || JSON.stringify(item) : item).join(', ');
    if (value && typeof value === 'object') return value.name || value.label || JSON.stringify(value);
    return value == null || value === '' ? '—' : String(value);
  }
  private label(value: string): string { return value.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()); }
  private records(response: any): any[] {
    const data = response?.data;
    if (Array.isArray(data)) return data;
    for (const key of ['appointments', 'treatments', 'treatmentRecords', 'records', 'items']) if (Array.isArray(data?.[key])) return data[key];
    return [];
  }
  private idOf(value: any): string {
    if (!value) return '';
    return typeof value === 'string' ? value : String(value._id || value.id || value.appointmentId || '');
  }
}
