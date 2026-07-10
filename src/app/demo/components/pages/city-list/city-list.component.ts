import { Component, OnInit, ViewChild } from '@angular/core';
import { FileUpload } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-city-list',
  templateUrl: './city-list.component.html',
  styleUrls: ['./city-list.component.scss']
})
export class CityListComponent implements OnInit {
  cities: any[] = [];
  filteredCities: any[] = [];
  states: any[] = [];
  selectedState: any = null;
  loading = false;
  clinicId = '';

  @ViewChild('fileUpload') fileUpload?: FileUpload;

  constructor(private api: AuthService, private msg: MessageService) {}

  ngOnInit(): void {
    const clinicData = JSON.parse(
      localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}'
    );
    this.clinicId = clinicData._id || '';
    this.loadStates();
    this.loadCities();
  }

  loadStates(): void {
    this.api.getStateList(this.clinicId).subscribe({
      next: (res: any) => {
        const list = res.data || res || [];
        this.states = list.map((item: any) => ({
          label: item.stateName || item.name || '',
          value: item._id || item.id || ''
        }));
      }
    });
  }

  loadCities(): void {
    this.loading = true;
    this.api.getCityList(this.clinicId).subscribe({
      next: (res: any) => {
        const list = res.data || res || [];
        this.cities = list;
        this.filteredCities = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onStateChange(): void {
    if (!this.selectedState) {
      this.filteredCities = [...this.cities];
      return;
    }
    this.filteredCities = this.cities.filter(city => city.stateId === this.selectedState);
  }

  onUpload(event: any): void {
    const file = event.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      this.processCsv(text);
      this.fileUpload?.clear();
    };
    reader.readAsText(file);
  }

  processCsv(text: string): void {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      this.msg.add({ severity: 'warn', summary: 'Upload', detail: 'CSV file contains no data.' });
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return headers.reduce((obj: any, header: string, index: number) => {
        obj[header] = values[index] ?? '';
        return obj;
      }, {});
    });

    const payload = rows.map((row: any) => ({
      clinicId: this.clinicId,
      cityName: row.cityname || row.city_name || row.city || '',
      cityCode: row.citycode || row.city_code || row.code || '',
      stateId: row.stateid || row.state_id || row.state || '',
      country: row.country || '',
      status: row.status || 'ACTIVE',
      notes: row.notes || ''
    }));

    this.api.bulkCreateCities(payload).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Upload', detail: 'Cities uploaded successfully' });
        this.loadCities();
      },
      error: err => {
        this.msg.add({ severity: 'error', summary: 'Upload failed', detail: err?.error?.message || 'Unable to process upload' });
      }
    });
  }
}
