import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type AdminResource = 'clinics' | 'countries' | 'states' | 'cities' | 'memberships' | 'treatmentmasters' | 'labmasters';

@Injectable({ providedIn: 'root' })
export class SuperAdminApiService {
  private readonly baseUrl = `${environment.apiUrl}/api/super-admin`;

  constructor(private http: HttpClient) {}

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  register(data: Record<string, unknown>): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  list(resource: AdminResource): Observable<any> {
    return this.http.get(`${this.baseUrl}/${resource}`);
  }

  create(resource: AdminResource, data: Record<string, unknown>): Observable<any> {
    return this.http.post(`${this.baseUrl}/${resource}`, data);
  }

  update(resource: AdminResource, id: string, data: Record<string, unknown>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${resource}/${encodeURIComponent(id)}`, data);
  }

  delete(resource: AdminResource, id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${resource}/${encodeURIComponent(id)}`);
  }
}
