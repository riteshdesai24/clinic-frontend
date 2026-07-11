import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({ selector: 'app-condition-list', templateUrl: './condition-list.component.html', styleUrls: ['./condition-list.component.scss'] })
export class ConditionListComponent implements OnInit {
  type: 'MEDICAL' | 'DENTAL' = 'MEDICAL';
  conditions: any[] = [];
  filteredConditions: any[] = [];
  loading = false;

  constructor(private api: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.type = this.router.url.includes('dental-condition') ? 'DENTAL' : 'MEDICAL';
    this.loadConditions();
  }

  get title() { return this.type === 'MEDICAL' ? 'Medical Conditions' : 'Dental Conditions'; }

  loadConditions(): void {
    this.loading = true;
    this.api.getConditionList(this.type).subscribe({
      next: (res: any) => { const data = res?.data || res || []; this.conditions = Array.isArray(data) ? data : []; this.filteredConditions = [...this.conditions]; this.loading = false; },
      error: () => { this.conditions = []; this.filteredConditions = []; this.loading = false; }
    });
  }

  search(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.filteredConditions = !query ? [...this.conditions] : this.conditions.filter(c =>
      [c.name, c.description, c.status].some(value => String(value || '').toLowerCase().includes(query))
    );
  }

  addCondition(): void { this.router.navigate(['/pages/condition'], { queryParams: { type: this.type } }); }
  editCondition(condition: any): void { this.router.navigate(['/pages/condition'], { queryParams: { type: this.type, id: condition._id || condition.id } }); }
  deleteCondition(condition: any): void {
    const id = condition._id || condition.id;
    if (!id || !confirm(`Delete ${condition.name || 'this condition'}?`)) return;
    this.api.deleteCondition(id).subscribe({ next: () => this.loadConditions() });
  }
}
