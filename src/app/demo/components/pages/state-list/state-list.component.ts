import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-state-list',
  templateUrl: './state-list.component.html',
  styleUrls: ['./state-list.component.scss']
})
export class StateListComponent implements OnInit {
  stateList: any[] = [];
  filteredStateList: any[] = [];
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
    this.loadStates();
  }

  loadStates(): void {
    this.loading = true;
    this.api.getStateList(this.clinicId).subscribe({
      next: (res: any) => {
        this.stateList = res.data || res || [];
        this.filteredStateList = [...this.stateList];
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to load states' });
      }
    });
  }

  onSearch(event: any): void {
    const value = event.target.value?.toLowerCase() || '';
    if (!value) {
      this.filteredStateList = [...this.stateList];
      return;
    }
    this.filteredStateList = this.stateList.filter(state =>
      state.stateName?.toLowerCase().includes(value) ||
      state.stateCode?.toLowerCase().includes(value) ||
      state.country?.toLowerCase().includes(value)
    );
  }

  createState(): void {
    this.router.navigate(['/pages/state']);
  }

  editState(state: any): void {
    this.router.navigate(['/pages/state'], { queryParams: { edit: true, id: state._id } });
  }

  viewState(state: any): void {
    this.router.navigate(['/pages/state'], { queryParams: { view: true, id: state._id } });
  }

  deleteState(state: any): void {
    this.confirm.confirm({
      message: `Delete state ${state.stateName}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deleteState(state._id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Deleted', detail: 'State deleted' });
            this.loadStates();
          },
          error: err => {
            console.error(err);
            this.msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
          }
        });
      }
    });
  }

  onFileSelect(event: any): void {
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
          stateName: row['State Name'] || row['stateName'] || row['name'] || '',
          stateCode: row['State Code'] || row['stateCode'] || row['code'] || '',
          country: row['Country'] || row['country'] || '',
          status: row['Status'] || row['status'] || 'ACTIVE',
          notes: row['Notes'] || row['notes'] || ''
        };
        return this.api.createState(payload);
      });

      this.loading = true;
      forkJoin(requests).subscribe({
        next: () => {
          this.loading = false;
          this.msg.add({ severity: 'success', summary: 'Imported', detail: 'States uploaded successfully' });
          this.loadStates();
        },
        error: err => {
          this.loading = false;
          console.error(err);
          this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload state Excel' });
          this.loadStates();
        }
      });
    };
    reader.readAsArrayBuffer(file);
  }
}
