import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-treatment-list',
  templateUrl: './treatment-list.component.html',
  styleUrls: ['./treatment-list.component.scss']
})
export class TreatmentListComponent implements OnInit {
  treatments: any[] = [];
  filteredTreatments: any[] = [];
  loading = false;
  constructor(private api: AuthService, private router: Router) {}

  ngOnInit(): void { this.loadTreatments(); }

  loadTreatments(): void {
    this.loading = true;
    this.api.getTreatmentList().subscribe({
      next: (res: any) => {
        const data = res?.data?.treatments || res?.data || res || [];
        this.treatments = Array.isArray(data) ? data : [];
        this.filteredTreatments = [...this.treatments];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  search(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.filteredTreatments = !query ? [...this.treatments] : this.treatments.filter(t =>
      [t.name, t.treatmentName, t.description].some(value => String(value || '').toLowerCase().includes(query))
    );
  }

  addTreatment(): void { this.router.navigate(['/pages/treatment']); }
  editTreatment(treatment: any): void { this.router.navigate(['/pages/treatment'], { queryParams: { id: treatment._id || treatment.id } }); }

  deleteTreatment(treatment: any): void {
    const id = treatment._id || treatment.id;
    if (!id || !confirm(`Delete ${treatment.name || treatment.treatmentName || 'this treatment'}?`)) return;
    this.api.deleteTreatment(id).subscribe({ next: () => this.loadTreatments() });
  }
}
