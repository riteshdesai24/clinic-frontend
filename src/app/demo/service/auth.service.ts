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

  getTreatmentList(): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/treatmenttypes`
    );
  }

  createTreatment(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/treatmenttypes`, data);
  }

  getTreatmentDetails(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/treatmenttypes/${id}`);
  }

  updateTreatment(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/treatmenttypes/${id}`, data);
  }

  deleteTreatment(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/treatmenttypes/${id}`);
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

  // ================= APPOINTMENT =================

  createAppointment(data: any): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/appointments`,
      data
    );
  }

  getAppointmentList(clinicId: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/appointments?clinicId=${clinicId}`
    );
  }

  getAppointmentDetails(id: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/appointments/${id}`
    );
  }

  updateAppointment(id: string, data: any): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/api/appointments/${id}`,
      data
    );
  }

  deleteAppointment(id: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/appointments/${id}`
    );
  }

  // ================= STATE =================

  createState(data: any): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/states`,
      data
    );
  }

  getStateList(clinicId?: string): Observable<any> {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    return this.http.get(
      `${environment.apiUrl}/api/states${params}`
    );
  }

  getStateDetails(id: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/states/${id}`
    );
  }

  updateState(id: string, data: any): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/api/states/${id}`,
      data
    );
  }

  deleteState(id: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/states/${id}`
    );
  }

  // ================= CITY =================

  createCity(data: any): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/cities`,
      data
    );
  }

  getCityList(clinicId?: string): Observable<any> {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    return this.http.get(
      `${environment.apiUrl}/api/cities${params}`
    );
  }

  getCityDetails(id: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/cities/${id}`
    );
  }

  updateCity(id: string, data: any): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/api/cities/${id}`,
      data
    );
  }

  deleteCity(id: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/cities/${id}`
    );
  }

  bulkCreateCities(data: any[]): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/cities/bulk`,
      data
    );
  }

  // ================= INSURANCE =================

  createInsurance(data: any): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/insurances`,
      data
    );
  }

  getInsuranceList(clinicId: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/insurances?clinicId=${clinicId}`
    );
  }

  getInsuranceDetails(id: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/insurances/${id}`
    );
  }

  updateInsurance(id: string, data: any): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/api/insurances/${id}`,
      data
    );
  }

  deleteInsurance(id: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/insurances/${id}`
    );
  }

  // ================= CONDITIONS =================

  createCondition(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/conditions`, data);
  }

  getConditionList(type?: 'MEDICAL' | 'DENTAL'): Observable<any> {
    const params = type ? `?type=${type}` : '';
    return this.http.get(`${environment.apiUrl}/api/conditions${params}`);
  }

  getConditionDetails(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/conditions/${id}`);
  }

  updateCondition(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/conditions/${id}`, data);
  }

  deleteCondition(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/conditions/${id}`);
  }

}
