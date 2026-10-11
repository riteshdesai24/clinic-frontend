import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-insurance-list',
  templateUrl: './insurance-list.component.html',
  styleUrls: ['./insurance-list.component.scss']
})
export class InsuranceListComponent implements OnInit {

  insuranceList: any[] = [];
  filteredInsuranceList: any[] = [];
  loading = false;
  page = 1;
  readonly pageSize = 10;

  get visibleInsuranceList(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredInsuranceList.slice(start, start + this.pageSize);
  }

  changePage(page: number): void { this.page = page; }

  constructor(
    private router: Router,
    private confirm: ConfirmationService,
    private msg: MessageService,
    private api: AuthService
  ) {}

  ngOnInit(): void {
    this.loadInsurances();
  }

  loadInsurances(): void {
    this.loading = true;

    this.api.getInsuranceList().subscribe({
      next: (res: any) => {
        const records = Array.isArray(res?.data) ? res.data
          : Array.isArray(res?.data?.insurances) ? res.data.insurances
          : Array.isArray(res) ? res
          : [];
        this.insuranceList = records.map((i: any) => this.toInsuranceListItem(i));
        this.filteredInsuranceList = [...this.insuranceList];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to load insurances' });
      }
    });
  }

  onSearch(e: any): void {
    this.page = 1;
    const value = e.target.value.toLowerCase();

    if (!value) {
      this.filteredInsuranceList = [...this.insuranceList];
      return;
    }

    this.filteredInsuranceList = this.insuranceList.filter(i =>
      i.insurerName?.toLowerCase().includes(value) ||
      i.policyNumber?.toLowerCase().includes(value) ||
      i.company?.toLowerCase().includes(value)
    );
  }

  private toInsuranceListItem(insurance: any): any {
    return {
      ...insurance,
      insurerName: insurance.insuranceCompany || insurance.insurerName || '',
      company: insurance.companyName || insurance.company || '',
      policyType: insurance.coverageType || insurance.policyType || '',
      contactNumber: insurance.contactPhone || insurance.contactNumber || '',
      email: insurance.contactEmail || insurance.email || ''
    };
  }

  createInsurance(): void {
    this.router.navigate(['/pages/insurance']);
  }

  editInsurance(item: any): void {
    this.router.navigate(['/pages/insurance'], {
      queryParams: { edit: true, id: item._id }
    });
  }

  viewInsurance(item: any): void {
    this.router.navigate(['/pages/insurance'], {
      queryParams: { view: true, id: item._id }
    });
  }

  deleteInsurance(item: any): void {
    this.confirm.confirm({
      message: `Delete policy ${item.policyNumber}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deleteInsurance(item._id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Deleted', detail: 'Insurance deleted' });
            this.loadInsurances();
          },
          error: () => {
            this.msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
          }
        });
      }
    });
  }

  onInsuranceFileSelect(event: any): void {
    const file = event.files?.[0];
    if (!file) {
      return;
    }

    this.loading = true;
    this.api.importInsurances(file).subscribe({
      next: (response: any) => {
        this.loading = false;
        const results = response?.data || {};
        this.msg.add({
          severity: results.errors?.length ? 'warn' : 'success',
          summary: results.errors?.length ? 'Import completed with issues' : 'Imported',
          detail: `${results.created || 0} created, ${results.updated || 0} updated, ${results.skipped || 0} skipped.`
        });
        this.loadInsurances();
      },
      error: (error: any) => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Import failed', detail: error?.error?.message || 'Unable to import this file.' });
      }
    });
  }
}
