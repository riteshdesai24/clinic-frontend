import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
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

  register(email: string, phone: string, password: string, clinicName: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/auth/register`,
      { email, phone, password, clinicName }
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/auth/forgot-password`,
      { email }
    );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/api/auth/reset-password/${encodeURIComponent(token)}`,
      { newPassword }
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/auth/change-password`, { oldPassword, newPassword });
  }

  getCurrentProfile(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/profile`);
  }

  updateCurrentProfile(data: Record<string, string>): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/profile`, data);
  }

  // ================= USERS =================

  getUsers(params: Record<string, string | number> = {}): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/users`, { params });
  }

  getUser(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/users/${encodeURIComponent(id)}`);
  }

  createUser(data: Record<string, unknown>): Observable<any> {
    // clinicLogo can be included in the payload when creating a clinic account.
    return this.http.post(`${environment.apiUrl}/api/users`, data);
  }

  updateUser(id: string, data: Record<string, unknown>): Observable<any> {
    // Keep this JSON based so logo data URLs and other profile fields are saved together.
    return this.http.put(`${environment.apiUrl}/api/users/${encodeURIComponent(id)}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/users/${encodeURIComponent(id)}`);
  }

  // ================= STAFF =================

  createStaff(data: any): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/staff`,
      data
    );
  }

  getStaffList(cursor?: string, limit?: number): Observable<any> {
    let params = new HttpParams().set('role', 'STAFF');
    if (cursor) params = params.set('cursor', cursor);
    if (limit) params = params.set('limit', String(limit));
    return this.http.get(
      `${environment.apiUrl}/api/staff`, { params }
    );
  }

  getStaffAutocomplete(query = ''): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/staff/autocomplete`, { params: { search: query } });
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
      `${environment.apiUrl}/api/doctors`,
      data
    );
  }

  getDoctorList(cursor?: string, limit?: number): Observable<any> {
    let params = new HttpParams().set('limit', String(limit || 10));
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get(
      `${environment.apiUrl}/api/doctors`,
      { params }
    );
  }

  getDoctorAutocomplete(query = ''): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/doctors/autocomplete`, { params: { search: query } });
  }

  getTreatmentList(params: Record<string, string | number> = {}): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/treatmentmaster`, { params });
  }

  createTreatment(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/treatmentmaster`, data);
  }

  getTreatmentDetails(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/treatmentmaster/${id}`);
  }

  updateTreatment(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/treatmentmaster/${id}`, data);
  }

  deleteTreatment(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/treatmentmaster/${id}`);
  }

  getDoctorDetails(id: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/doctors/${id}`
    );
  }

  updateDoctor(id: string, data: any): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/api/doctors/${id}`,
      data
    );
  }

  deleteDoctor(id: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/doctors/${id}`
    );
  }

  // ================= PATIENT =================

  createPatient(data: any): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/patients`,
      data
    );
  }

  getPatientList(): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/patients`
    );
  }

  getPatientAutocomplete(query = ''): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/patients/autocomplete`, { params: { search: query } });
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

  getAppointmentList(params: Record<string, string | number> = {}): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/appointments`, { params });
  }

  getAppointmentCalendar(params: Record<string, string | number>): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/appointments/calendar`, { params });
  }

  getDashboardAppointmentCounts(period: 'today' | 'week' | 'month' | 'all', doctorId?: string): Observable<any> {
    const params: Record<string, string> = { period };
    if (doctorId) params['doctorId'] = doctorId;
    return this.http.get(`${environment.apiUrl}/api/dashboard/appointments`, { params });
  }

  getDashboardInvoiceSummary(period: 'week' | 'month', doctorId?: string): Observable<any> {
    const params: Record<string, string> = { period };
    if (doctorId) params['doctorId'] = doctorId;
    return this.http.get(`${environment.apiUrl}/api/invoices/dashboard/summary`, { params });
  }

  createInvoice(data: Record<string, unknown>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/invoices`, data);
  }

  getInvoices(params: Record<string, string | number> = {}): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/invoices`, { params });
  }

  getInvoicePdf(invoiceId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/api/invoices/${encodeURIComponent(invoiceId)}/pdf`, { responseType: 'blob' });
  }

  recordInvoicePayment(invoiceId: string, data: { amount: number; method: string; reference?: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/invoices/${invoiceId}/payments`, data);
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

  deleteAppointment(id: string, reason: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/appointments/${id}`,
      { body: { reason } }
    );
  }

  uploadAppointmentAttachments(appointmentId: string, files: { file: File; fileName: string }[]): Observable<any> {
    const body = new FormData();
    files.forEach(({ file, fileName }) => { body.append('files', file); body.append('fileName', fileName.trim() || file.name); });
    return this.http.post(`${environment.apiUrl}/api/appointments/${appointmentId}/attachments`, body);
  }
  getAppointmentAttachments(appointmentId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/appointments/${appointmentId}/attachments`);
  }
  downloadAppointmentAttachment(appointmentId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/api/appointments/${appointmentId}/attachments/${attachmentId}`, { responseType: 'blob' });
  }
  deleteAppointmentAttachment(appointmentId: string, attachmentId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/appointments/${appointmentId}/attachments/${attachmentId}`);
  }

  // ================= ATTENDANCE =================

  clockIn(): Observable<any> { return this.http.post(`${environment.apiUrl}/api/attendance/clock-in`, {}); }
  clockOut(): Observable<any> { return this.http.post(`${environment.apiUrl}/api/attendance/clock-out`, {}); }
  getTodayAttendance(): Observable<any> { return this.http.get(`${environment.apiUrl}/api/attendance/me/today`); }
  getMyAttendance(params: Record<string, string | number> = {}): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/attendance/me`, { params });
  }
  getAttendanceList(params: Record<string, string | number> = {}): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/attendance`, { params });
  }
  getAttendanceSummary(params: Record<string, string | number> = {}): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/attendance/summary`, { params });
  }
  markAttendance(data: Record<string, unknown>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/attendance/mark`, data);
  }
  deleteAttendance(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/api/attendance/${id}`); }

  // ================= TREATMENT RECORDS =================

  createTreatmentRecord(data: Record<string, unknown>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/treatments`, data);
  }
  getTreatmentRecords(params: Record<string, string | number> = {}): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/treatments`, { params });
  }
  getTreatmentRecord(id: string): Observable<any> { return this.http.get(`${environment.apiUrl}/api/treatments/${id}`); }
  updateTreatmentRecord(id: string, data: Record<string, unknown>): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/treatments/${id}`, data);
  }
  deleteTreatmentRecord(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/api/treatments/${id}`); }
  uploadTreatmentAttachments(treatmentId: string, files: { file: File; fileName: string }[]): Observable<any> {
    const body = new FormData();
    files.forEach(({ file, fileName }) => { body.append('files', file); body.append('fileName', fileName.trim() || file.name); });
    return this.http.post(`${environment.apiUrl}/api/treatments/${treatmentId}/attachments`, body);
  }
  getTreatmentAttachments(treatmentId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/treatments/${treatmentId}/attachments`);
  }
  downloadTreatmentAttachment(treatmentId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/api/treatments/${treatmentId}/attachments/${attachmentId}`, { responseType: 'blob' });
  }
  deleteTreatmentAttachment(treatmentId: string, attachmentId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/treatments/${treatmentId}/attachments/${attachmentId}`);
  }

  uploadPatientAttachments(patientId: string, files: { file: File; fileName: string }[]): Observable<HttpEvent<any>> {
    const body = new FormData();
    files.forEach(({ file, fileName }) => { body.append('files', file); body.append('fileName', fileName.trim() || file.name); });
    return this.http.post(`${environment.apiUrl}/api/patients/${patientId}/attachments`, body, { reportProgress: true, observe: 'events' });
  }
  getPatientAttachments(patientId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/patients/${patientId}/attachments`);
  }
  downloadPatientAttachment(patientId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/api/patients/${patientId}/attachments/${attachmentId}`, { responseType: 'blob' });
  }

  uploadDoctorAttachments(doctorId: string, files: { file: File; fileName: string }[]): Observable<HttpEvent<any>> {
    const body = new FormData();
    files.forEach(({ file, fileName }) => {
      body.append('files', file);
      body.append('fileName', fileName.trim() || file.name);
    });
    return this.http.post(`${environment.apiUrl}/api/doctors/${doctorId}/attachments`, body, { reportProgress: true, observe: 'events' });
  }
  getDoctorAttachments(doctorId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/doctors/${doctorId}/attachments`);
  }
  downloadDoctorAttachment(doctorId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/api/doctors/${doctorId}/attachments/${attachmentId}`, { responseType: 'blob' });
  }

  // ================= PLANS AND PAYMENTS =================

  getPlans(): Observable<any> { return this.http.get(`${environment.apiUrl}/api/plans`); }
  getPlan(id: string): Observable<any> { return this.http.get(`${environment.apiUrl}/api/plans/${id}`); }
  createPlan(data: Record<string, unknown>): Observable<any> { return this.http.post(`${environment.apiUrl}/api/plans`, data); }
  updatePlan(id: string, data: Record<string, unknown>): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/plans/${id}`, data);
  }
  deletePlan(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/api/plans/${id}`); }
  createPaymentOrder(amount: number, plan: 'FREE' | 'SILVER' | 'GOLD' | 'BRONZE' | 'PLATINUM'): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/payments/create-order`, { amount, plan });
  }
  verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan?: 'FREE' | 'SILVER' | 'GOLD' | 'BRONZE' | 'PLATINUM';
    planActivatedAt?: string;
    planExpiresAt?: string;
  }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/payments/verify`, data);
  }
  getPaymentHistory(): Observable<any> { return this.http.get(`${environment.apiUrl}/api/payments/history`); }

  // ================= INSURANCE =================

  createInsurance(data: any): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/insurances`,
      data
    );
  }

  getInsuranceList(): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/api/insurances`
    );
  }

  importInsurances(file: File): Observable<any> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post(`${environment.apiUrl}/api/insurances/import`, body);
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
