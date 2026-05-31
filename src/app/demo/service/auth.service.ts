import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private http: HttpClient) {}

  // ================= AUTH =================

  login(email: string, password: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/auth/login`,
      { email, password }
    );
  }

  register(
    name: string,
    email: string,
    phone: string,
    password: string,
    clinicName: string
  ): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/auth/register`,
      { name, email, phone, password, clinicName }
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/auth/forgot-password`,
      { email }
    );
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/auth/reset-password`,
      data
    );
  }

  // ================= STAFF =================

  createStaff(data: any): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/staff`,
      data
    );
  }

  getStaffList(cursor?: string, limit?: number): Observable<any> {
    let params = `?role=STAFF`;
    if (cursor) params += `&cursor=${cursor}`;
    if (limit)  params += `&limit=${limit}`;
    return this.http.get(
      `${environment.apiUrl}/api/staff${params}`
    );
  }

  getStaffDetails(id: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/staff/${id}`
    );
  }

  updateStaff(id: string, data: any): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/api/staff/${id}`,
      data
    );
  }

  deleteStaff(id: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/staff/${id}`
    );
  }

  // ================= DOCTOR =================

  createDoctor(data: any): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/staff`,
      data
    );
  }

  getDoctorList(cursor?: string, limit?: number): Observable<any> {
    let params = `?role=DOCTOR`;
    if (cursor) params += `&cursor=${cursor}`;
    if (limit)  params += `&limit=${limit}`;
    return this.http.get(
      `${environment.apiUrl}/api/staff${params}`
    );
  }

  getDoctorDetails(id: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/staff/${id}`
    );
  }

  updateDoctor(id: string, data: any): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/api/staff/${id}`,
      data
    );
  }

  deleteDoctor(id: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/staff/${id}`
    );
  }

  // ================= PATIENT =================

  createPatient(data: any): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/patients`,
      data
    );
  }

  getPatientList(clinicId: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/patients?clinicId=${clinicId}`
    );
  }

  getPatientDetails(id: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/patients/${id}`
    );
  }

  updatePatient(id: string, data: any): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/api/patients/${id}`,
      data
    );
  }

  deletePatient(id: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/patients/${id}`
    );
  }

}