import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
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
  clinicId = '';

  constructor(
    private router: Router,
    private confirm: ConfirmationService,
    private msg: MessageService,
    private api: AuthService
  ) {}

  ngOnInit(): void {
    const clinicData = JSON.parse(
      localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}'
    );

    this.clinicId = clinicData._id || '';
    this.loadInsurances();
  }

  loadInsurances(): void {
    if (!this.clinicId) {
      return;
    }

    this.loading = true;

    this.api.getInsuranceList(this.clinicId).subscribe({
      next: (res: any) => {
        const records = Array.isArray(res?.data) ? res.data
          : Array.isArray(res?.data?.insurances) ? res.data.insurances
          : Array.isArray(res) ? res
          : [];
        this.insuranceList = records.map((i: any) => this.toInsuranceListItem(i));
        this.filteredInsuranceList = [...this.insuranceList];
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to load insurances' });
      }
    });
  }

  onSearch(e: any): void {
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
          error: err => {
            console.error(err);
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

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result;
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rows.length) {
        this.msg.add({ severity: 'warn', summary: 'No data', detail: 'Excel file contains no rows' });
        return;
      }

      const requests = rows.map(row => {
        const payload = {
          clinicId: this.clinicId,
          insuranceCompany: row['Insurer Name'] || row['insuranceCompany'] || row['insurerName'] || row['insurer'] || '',
          companyName: row['Company'] || row['companyName'] || row['company'] || '',
          policyNumber: row['Policy Number'] || row['policyNumber'] || '',
          coverageType: row['Policy Type'] || row['coverageType'] || row['policyType'] || '',
          coverageAmount: row['Coverage Amount'] || row['coverageAmount'] || '',
          contactPhone: row['Contact Number'] || row['contactPhone'] || row['contactNumber'] || '',
          contactEmail: row['Email'] || row['contactEmail'] || row['email'] || '',
          status: row['Status'] || row['status'] || 'ACTIVE',
          startDate: row['Start Date'] || row['startDate'] || null,
          endDate: row['End Date'] || row['endDate'] || null,
          notes: row['Notes'] || row['notes'] || ''
        };
        return this.api.createInsurance(payload);
      });

      this.loading = true;
      forkJoin(requests).subscribe({
        next: () => {
          this.loading = false;
          this.msg.add({ severity: 'success', summary: 'Imported', detail: 'Insurance data uploaded successfully' });
          this.loadInsurances();
        },
        error: err => {
          this.loading = false;
          console.error(err);
          this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload insurance Excel' });
          this.loadInsurances();
        }
      });
    };

    reader.readAsArrayBuffer(file);
  }
}
